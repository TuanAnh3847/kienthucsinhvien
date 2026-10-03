const assert = require('node:assert/strict');
async function chooseChapter(page,id) {
  const picker=page.locator('#edu-chapter-picker');
  if (await picker.isVisible()) {
    await picker.selectOption(id);
    assert.equal(await picker.inputValue(),id,'native chapter picker stays synchronized');
  } else await page.locator(`#nav-menu [data-edu-tab="${id}"]`).click();
}
async function visibleChapterControl(page) {
  return await page.locator('#edu-chapter-picker').isVisible() ? page.locator('.edu-theory-picker') : page.locator('#nav-menu');
}
module.exports={chooseChapter,visibleChapterControl};
