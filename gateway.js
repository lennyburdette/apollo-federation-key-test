const { ApolloServer } = require('apollo-server');
const { ApolloGateway } = require("@apollo/gateway");

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'a', url: 'http://localhost:4001' },
    { name: 'b', url: 'http://localhost:4002' }
  ],
});

const server = new ApolloServer({
  gateway,
  subscriptions: false
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`);
});
