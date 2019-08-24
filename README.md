# Apollo Federation @key Agreement

## System overview

* Service A: Payment lookup service that's "sharded" by business.

  It's more efficient to include the business ID in the lookup arguments so that we don't have to scan all shards for the payment.

* Service B: Payment search service with secondary indexes (elasticsearch, etc.)

  It doesn't really care about business ids, but it does store them.

## Reproduction steps

1. `yarn install`
2. `./run.sh`
3. Open http://localhost:4000/
4. Execute query:
    ```gql
    {
      # field on service-b
      searchPayments(amount: {lt: 300}) {
        id
        amount
        createdAt # comes from service-a
      }
    }
    ```
5. Observe the error. Notice that the query plan does not send `business { id }` to service-a, even though it declares `@key(fields: "id business { id }")`.
    ```gql
    Flatten(path: "searchPayments.@") {
      Fetch(service: "a") {
        {
          ... on Payment {
            __typename
            id
          }
        } =>
        {
          ... on Payment {
            createdAt
          }
        }
      },
    },
    ```
6. Ctrl-c the running process.
7. Change the `@key` declaration in service-b.js:9 so that the `@key` declarations agree.
8. Restart `./run.sh`. Re-run the query and observe a successful response.

## Questions

1. Should there be a requirement that `@key` directives have to agree?

  The gateway doesn't enforce agreement today. In this case, the services have different indexes and lookup requirements so disagreement in keys makes sense.

2. When a services declares the `@key` for an entity, does that specify its _own_ requirements for lookup by representation, or does it declare what values it can provide for lookups in other services?

  I expected that when the gateway creates a representation to send to service-a, it would use service-a's `@key` directive.

  Instead, it appears that the gateway uses service-b's `@key` directive to create the representation to send to service-a. This is weird, because it's service-a that requires a compound key in its `Payment.__resolveReference`.

  However, if service-b did _not_ include `business { id }` in its `@key` directive, the gateway wouldn't have a way to enforce that its version of the `Payment` type includes a `business` field.
