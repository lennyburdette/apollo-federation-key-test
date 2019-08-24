const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');

const typeDefs = gql`
  extend type Business @key(fields: "id") {
    id: ID! @external
  }

  # extend type Payment @key(fields: "id business { id }") {
  extend type Payment @key(fields: "id") {
    id: ID! @external
    business: Business! @external
    amount: Int! @external
  }

  input AmountFilter {
    lt: Int,
    gt: Int
  }

  extend type Query {
    searchPayments(amount: AmountFilter): [Payment!]! @provides(fields: "amount business")
  }
`;

const resolvers = {
  Payment: {
    __resolveReference(ref) {
      return DB[ref.id];
    }
  },
  Query: {
    searchPayments(_, { amount }) {
      if (amount.lt) {
        return paymentsBelow(amount.lt);
      } else if (amount.gt) {
        return paymentsAbove(amount.gt);
      } else {
        return Object.values(DB);
      }
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }])
});

server.listen(4002).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const DB = {
  1: { id: 1, business: { id: 'A' }, amount: 123 },
  2: { id: 2, business: { id: 'A' }, amount: 234 },
  3: { id: 3, business: { id: 'B' }, amount: 345 },
};

const AmountIndex = {
  123: 1,
  234: 2,
  345: 3
};

function paymentsAbove(amount) {
  return Object.entries(AmountIndex)
    .filter(([value]) => value > amount)
    .map(([_, id]) => DB[id]);
}

function paymentsBelow(amount) {
  return Object.entries(AmountIndex)
    .filter(([value]) => value < amount)
    .map(([_, id]) => DB[id]);
}

