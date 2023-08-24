export const patchStyles = (el, prev, next) => {
  //
  const style = el.style; // 获取样式

  if (next == null) {
    el.removeAttribute("style");
  } else {
    // 老的里边新的样式有没有
    if (prev) {
      for (let key in prev) {
        if (next[key] == null) {
          // 旧的里边有 新的没有  需要删除
          style[key] = "";
        }
      }
    }

    // 新的里边老的央视有没有
    for (let key in next) {
      style[key] = next[key];
    }
  }
};
