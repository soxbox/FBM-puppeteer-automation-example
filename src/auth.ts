import { Page } from 'puppeteer';

export async function authenticate(
  page: Page,
  username: string,
  password: string
) {
  await page.type('#username', username);
  await page.type('#password', password);
  await page.click('#loginform input[type="submit"]');
  await page.waitForNavigation();
  console.log('New Page URL:', page.url());
}
