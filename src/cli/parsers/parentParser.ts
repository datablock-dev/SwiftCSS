export default function parentParser(className: string){
    /*
        The regex identifies patterns with square brackets followed by a ':'
        like hover:[div]:py-10 -> [div]:py-10
        or [div]:py-10 -> [div]:py-10
    */
    
    const regex = /\[[^\]]+\]:[^\[]+/;
    const valueRegex = /\[([^\]]+)\]/;
    const match = className.match(regex)
    const valueMatch = className.match(valueRegex)
    const lastIndex = className.lastIndexOf(']:')

    if(match && valueMatch){
        const parentSelector = valueMatch[1] // The selector inside the brackets
        const classSelector = className.substring(lastIndex + 2, className.length) // The class to be applied
        const pseudoSelector = className.replace(`[${parentSelector}]:${classSelector}`, '');
        
        console.log(parentSelector, classSelector)
    }

    return null;
}