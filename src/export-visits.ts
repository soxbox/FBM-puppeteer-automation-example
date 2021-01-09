import Bluebird from 'bluebird';
import parse from 'csv-parse/lib/sync';
import { Page } from 'puppeteer';

async function fill(page: Page, el: string, value: string | string) {
  const tagName = await page.$eval(el, (button) => button.tagName);
  switch (tagName) {
    case 'INPUT':
      await page.$eval(el, (el) => (el.value = ''));
      await page.type(el, value);
      break;
    case 'SELECT':
      await page.select(el, value);
      break;
  }
  await Bluebird.delay(100);
}

async function captureFormResponse(page: Page, el: string, action: string) {
  const result = await page.evaluate(
    async (formEl, action) => {
      const form = document.querySelector(formEl);
      const data = new FormData(form);

      // if the button value is not part of the request
      // then the download is not prompted
      data.append('action', form.getAttribute('action'));
      console.log(data, form.action);
      //
      return (
        fetch(form.getAttribute('action'), {
          method: 'POST',
          credentials: 'include',
          body: data,
        })
          // I'm expecting to download a CSV so it's "safe"
          // It is actually sent as latin1 instead of utf8…
          .then((response) => response.text())
      );
    },
    el,
    action
  );

  // CSV data as plain text
  return result;
}

export async function exportClients(
  page: Page,
  baseUrl: string,
  filters: { key: string; value1?: string; value2?: string; value?: string }[],
  columns: string[]
) {
  await page.goto(`${baseUrl}/reports/guests/visits2/`, {
    waitUntil: 'networkidle0',
  });
  let i = 0;
  await Bluebird.mapSeries(filters, async (filter) => {
    if (!(await page.$(`#filter_column_${i}`))) {
      await page.click('.addFilter');
      await page.waitForSelector(`#filter_column_${i}`, { visible: true });
    }

    await page.select(`#filter_column_${i}`, filter.key);
    if (filter.value1) {
      await fill(page, `#filter_column_${i}_value1`, filter.value1);
    }
    if (filter.value2) {
      await fill(page, `#filter_column_${i}_value2`, filter.value2);
    }
    if (filter.value) {
      await fill(page, `#filter_column_${i}_value`, filter.value);
    }
    i++;
  });
  const res = await captureFormResponse(page, '#settingsForm', 'Export');
  const csv = parse(res, {
    columns: true,
    skip_empty_lines: true,
  });
  return csv;
}
