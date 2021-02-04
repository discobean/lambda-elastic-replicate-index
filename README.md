# lambda-elastic-replicate-index
Replicate and sync an elastic index changes over time.  (Cheap man's cross cluster replication)

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

## How to get the `updated` field in elastic?
You can either set the field manually each time you index or update documents.

The other option is to use an ingest pipeline, this will ensure any update
to the index will set a new updated field.  This is done like so:
```
PUT _ingest/pipeline/set-updated-timestamp
{
  "description": "add updated field to the document",
  "processors": [
    {
      "set": {
        "field": "_source.updated",
        "value": "{{_ingest.timestamp}}"
      }

    }
  ]
}
``` 

Next, you have to assign this pipeline to your index, you can do this 2 ways:
1. By setting the default pipeline in the index `_settings`
2. Define the pipeline in an index template

This example shows how to do it by setting the `_settings` directly in an index
```
PUT /my-index-i-want-to-replicate/_settings
{
  "default_pipeline" : "set-updated-timestamp"
}
```

From now any updates to the index `my-index-i-want-to-replicate` will set a new
`updated` field with a timestamp, ready to use for replication.