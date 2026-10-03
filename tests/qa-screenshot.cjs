// QA assertions always run. Image artifacts require explicit opt-in.
async function screenshot(target, options) {
  if (process.env.QA_SCREENSHOTS !== '1') return;
  return target.screenshot(options);
}
module.exports = {screenshot};
