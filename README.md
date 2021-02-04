# lambda-elastic-replicate-index
Replicate and sync an elastic index changes over time.

Deployed via nodejs' serverless.

This lets you sync a index from one elastic search cluster to another elasticsearch cluster using a lambda function.

## How it works
It performs a search on an index with a filter on a date field like `updatedAt` or similar, then syncs those updated records to the other index.
It runs on a schedule as defined in your `serverless.yaml` file

Once a replication is complete the latest `updatedAt` date is stored in a checkpoint in the source elasticsearch cluster.

## The configuration
Look at the `config-example.yaml` file to see how it works.

Essentially specify a `source` and `destination`, specify the search field `updatedAt` and the elasticsearch authentication information.  You are then ready to go.

## Steps to get it running

1. `npm install`
2. Copy `config-example.yaml` to `config-dev.yaml`
3. Edit the `config-dev.yaml` to add your configuration
4. Review `serverless.yaml` to update as required
5. `serverless deploy -v` or `make development`
