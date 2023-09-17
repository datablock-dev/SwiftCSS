export function parseDynamicStyles(style: string) {
    const dynamicStyleRegex = /-(?:\[([^\]]+)\])/g;
    let match;
    let parsedStyle = style;
  
    while ((match = dynamicStyleRegex.exec(style))) {
      const dynamicValue = match[1];
      const dynamicClassName = match[0];
      let dynamicStyleValue;
  
      if (dynamicValue.startsWith('url')) {
        const urlRegex = /^url\((.*)\)$/;
        const urlMatch = dynamicValue.match(urlRegex);
        if (urlMatch) {
          dynamicStyleValue = `url(${urlMatch[1]})`;
        }
      } else if (dynamicValue.startsWith('#')) {
        const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
        const hexColorMatch = dynamicValue.match(hexColorRegex);
        if (hexColorMatch) {
          dynamicStyleValue = `#${hexColorMatch[1]}`;
        }
      }
  
      if (dynamicStyleValue) {
        parsedStyle = parsedStyle.replace(
          // @ts-ignore
          RegExp.escape(dynamicClassName),
          dynamicStyleValue
        );
      }
    }
  
    return parsedStyle;
}

export function generateDynamicStyles(themeClassName: string, classNames: any[], styleCSS: string) {
  const dynamicStyles = new Array;
  classNames.forEach((className: string) => {
    const dynamicStyleRegex = new RegExp(`\\.${className}-(?:\\[([\\w#-]+)\\])`, 'g');
    const dynamicStyleMatches = styleCSS.match(dynamicStyleRegex);
  
    if (dynamicStyleMatches) {
      dynamicStyleMatches.forEach((match: string) => {
        const dynamicStyle = match.replace(`.${className}`, '').trim();
        const parsedStyle = parseDynamicStyles(dynamicStyle);
        dynamicStyles.push(`.${className}${parsedStyle}`);
      });
    }
  });
  
  return dynamicStyles;
}