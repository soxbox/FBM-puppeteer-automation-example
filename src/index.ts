import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { authenticate } from './auth';
import bluebird from 'bluebird';
import { exportClients } from './export-visits';
import { DateTime } from 'luxon';
import path from 'path';
import rimraf from 'rimraf';

dotenv.config();

const { BASE_URL, USERNAME, PASSWORD } = process.env;

const lastMonth = DateTime.local().minus({ month: 1 });
const start = DateTime.local(lastMonth.year, lastMonth.month, 1);
const end = DateTime.local(
  lastMonth.year,
  lastMonth.month,
  lastMonth.daysInMonth
);

const run = async () => {
  await new Promise((resolve) =>
    rimraf(path.join(path.dirname(__dirname), 'cache', '*'), resolve)
  );
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    // This path must match the WORKSPACE_DIR in Step 1
    downloadPath: path.join(path.dirname(__dirname), 'cache'),
  });
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await authenticate(page, USERNAME, PASSWORD);
  const visits = await exportClients(page, BASE_URL, [
    {
      key: 'visits.visit_on',
      value1: start.toISODate(),
      value2: end.toISODate(),
    },
    {
      key: 'visitTrack.status',
      value: '1',
    },
  ]);
  let activeOutreach = 0;

  await bluebird.mapSeries(visits, async (visit) => {
    const outreachId = Number(visit['Outreach ID']);
    const guestId = Number(visit['Guest ID']);
    if (activeOutreach !== outreachId) {
      await page.goto(
        `${BASE_URL}/create-new-visit/setDate-outreach/${outreachId}/`,
        { waitUntil: 'load' }
      );
      activeOutreach = outreachId;
    }
    await page.goto(`${BASE_URL}/create-new-visit/guest/${guestId}/`, {
      waitUntil: 'networkidle0',
    });
    await bluebird.delay(1000);
  });
  await bluebird.delay(10000);
  await browser.close();
};

run();
