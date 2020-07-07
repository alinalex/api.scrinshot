const CronJobManager = require('cron-job-manager');
const runScreenshot = require('../automation/runScreenshot');

let manager = new CronJobManager();

exports.setCron = async (id, time, url) => {
  manager.add(
    id,
    time + ' * * *',
    async () => {
      const res = await runScreenshot(url, id);
      if (!res) {
        // stop cron
        manager.stop(id);
      }

      var jobs = manager.listCrons();
      console.log(jobs);
    },
    {
      start: true,
    }
  );

  var jobs = manager.listCrons();
  console.log(jobs);
};

exports.updateCron = async (id, time, url) => {
  manager.update(id, time + ' * * *', async () => {
    const res = await runScreenshot(url, id);
    if (!res) {
      // stop cron
      manager.stop(id);
    }

    var jobs = manager.listCrons();
    console.log(jobs);
  });

  manager.start(id);

  var jobs = manager.listCrons();
  console.log(jobs);
};

exports.deleteCron = async (id) => {
  manager.deleteJob(id);

  var jobs = manager.listCrons();
  console.log(jobs);
};
