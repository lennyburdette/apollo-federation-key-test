const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');

const typeDefs = gql`
  type Business @key(fields: "id") {
    id: ID!
    name: String!
  }

  type Payment @key(fields: "id business { id }") {
    id: ID!
    business: Business!
    amount: Int!
    createdAt: String!
  }

  extend type Query {
    payment(id: ID!, businessID: ID!): Payment
  }
`;

const resolvers = {
  Payment: {
    __resolveReference(ref) {
      return (DB[ref.business.id] || {})[ref.id];
    }
  },
  Query: {
    payment(_, { id, businessID }) {
      return (DB[businessID] || {})[id];
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }])
});

server.listen(4001).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const DB = {
  A: {
    '1': { id: 1, business: { id: 'A' }, amount: 123, createdAt: '2019-08-22' },
    '2': { id: 2, business: { id: 'A' }, amount: 234, createdAt: '2019-08-23' },
  },
  B: {
    '3': { id: 3, business: { id: 'B' }, amount: 345, createdAt: '2019-08-24' },
  }
};
