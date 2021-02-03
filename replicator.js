"use strict";

const _ = require("lodash");

const getCheckpoint = async (task, sourceClient) => {
  const { index, id } = task.source.getCheckpointOpts;

  console.log("getCheckpoint index: " + index);
  console.log("getCheckpoint id: " + id);

  const getResult = await sourceClient.get(
    {
      id: id,
      index: index,
      type: "_doc",
    },
    { ignore: [404] }
  );

  const data = _.get(getResult, "body._source.latest_commit", null);
  console.log("getCheckpoint, latest_commit: " + data);
  return Promise.resolve(data);
};

const setCheckpoint = async (task, sourceClient, latestCommit) => {
  if (!latestCommit) return;

  const { index, id } = task.source.getCheckpointOpts;

  console.log(
    "setCheckpoint, setting index/id = value: " +
      index +
      "/" +
      id +
      " = " +
      latestCommit
  );

  await sourceClient.index({
    id: id,
    index: index,
    body: {
      latest_commit: latestCommit,
    },
  });
};

const syncDocuments = async (
  task,
  sourceClient,
  destinationClient,
  checkpoint
) => {
  // the field that has the updated date in it
  const updatedField = task.source.searchUpdatedField;

  let query = { range: { [updatedField]: { gt: 0 } } };

  if (checkpoint !== null) {
    console.log("syncDocuments, using checkpoint value: " + checkpoint);
    query = {
      range: {
        [updatedField]: {
          gt: checkpoint,
        },
      },
    };
  }

  const params = {
    ...task.source.searchOpts,
    body: {
      sort: [{ updated: { order: "asc" } }],
      query: query,
    },
  };

  let sourceResponse = await sourceClient.search(params);

  let totalRecords = 0;
  let latestCommit = checkpoint;
  while (true) {
    const sourceHits = sourceResponse.body.hits.hits;

    // no data, just finish
    if (sourceHits.length === 0) break;

    const destinationBulkData = sourceHits.flatMap((doc) => {
      console.log("It is: " + doc._source.updated);
      return [
        { index: { _index: task.destination.index, _id: doc._id } },
        doc._source,
      ];
    });

    await destinationClient.bulk({
      body: destinationBulkData,
    });
    totalRecords += sourceHits.length;
    console.log("Done bulk update of " + sourceHits.length + " records");

    // get the last update latest_commit, and save that as a checkpoint before getting
    // the next batch
    const latestCommitInBatch =
      sourceHits[sourceHits.length - 1]._source[updatedField];

    if (latestCommitInBatch) {
      await setCheckpoint(task, sourceClient, latestCommitInBatch);
      latestCommit = latestCommitInBatch;
    }

    if (totalRecords >= _.get(sourceResponse, "body.hits.total.value", 0)) {
      console.log("Breaking loop completed all hits");
      break;
    }

    if (!sourceResponse.body._scroll_id) break;

    sourceResponse = await sourceClient.scroll({
      scrollId: sourceResponse.body._scroll_id,
      scroll: params.scroll,
    });
  }

  return Promise.resolve({ totalRecords, latestCommit });
};

module.exports = {
  syncDocuments,
  getCheckpoint,
  setCheckpoint,
};
