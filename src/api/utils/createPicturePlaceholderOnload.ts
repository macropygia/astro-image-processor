export const createPicturePlaceholderOnload = (
  cssVariable: string,
  {
    removeOnComplete = false,
    scheduleCleanupMs,
  }: { removeOnComplete?: boolean; scheduleCleanupMs?: number } = {},
) => {
  const run = `parentElement.style.setProperty('${cssVariable}', 'running');`;
  const cleanup = scheduleCleanupMs
    ? `setTimeout(()=>{const p=parentElement;if(!p||!p.style)return;p.style.removeProperty('${cssVariable}');p.style.removeProperty('background-image');p.style.removeProperty('background-color');if(!p.getAttribute('style')?.trim())p.removeAttribute('style');},${scheduleCleanupMs});`
    : '';
  const removeOnload = removeOnComplete ? "removeAttribute('onload');" : '';
  return `${run}${cleanup}${removeOnload}`;
};
