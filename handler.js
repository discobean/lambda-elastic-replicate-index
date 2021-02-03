"use strict";

const elasticsearch = require("@elastic/elasticsearch");
const yaml = require("js-yaml");
const fs = require("fs");

const { syncDocuments, getCheckpoint } = require("./replicator");

module.exports.replicate = async (event) => {
  console.log("Starting...");

  let filename = "./config-dev.yaml";
  if (process.env.STAGE === "prod") {
    filename = "./config-prod.yaml";
  }

  let tasks = {};
  try {
    console.log("Reading configuration...");
    const fileContents = fs.readFileSync(filename, "utf8");
    const data = yaml.load(fileContents);
    tasks = data.tasks;
  } catch (e) {
    console.log(e);
    return;
  }

  let totalRecords = 0;
  let latestCommit = null;

  // get the last checkpoint from the sourceClient
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    console.log("Executing replication task: " + task.name);

    const sourceClient = new elasticsearch.Client(
      task.source.elasticClientOpts
    );
    const destinationClient = new elasticsearch.Client(
      task.destination.elasticClientOpts
    );

    const checkpoint = await getCheckpoint(task, sourceClient);
    latestCommit = checkpoint;
    const result = await syncDocuments(
      task,
      sourceClient,
      destinationClient,
      checkpoint
    );

    totalRecords = result.totalRecords;
    latestCommit = result.latestCommit;

    console.log("Replication done");
    console.log("Total records: " + totalRecords);
    console.log("Latest checkpoint: " + latestCommit);
    console.log("Completed replication task: " + task.name);
  }

  console.log("Finished all replication tasks");
  return {
    message: "Finished all replication tasks",
    event,
  };
};

// if run directly
if (require.main === module) {
  module.exports.replicate({});
}
