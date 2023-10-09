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

    if(match && valueMatch){
        console.log(match[0])
        console.log(valueMatch[1], valueMatch)
    }

    return null;
}