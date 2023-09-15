export interface Config {
    fileExtensions: any[string]
    directories: any[string]
    input: string
    output: string
    screens: {
        [key: string]: {[key: string]: number}
    }
}

export interface DynamicClasses {
    [key: string]: any
}

type approvedPseudoClasses = 
'active'|
'any'|
'any-link'|
'checked'|
'default'|
'defined'|
'dir'|
'disabled'|
'empty'|
'enabled'|
'first'|
'first-child'|
'first-of-type'|
'fullscreen'|
'focus'|
'focus-visible'|
'focus-within'|
'has'|
'hover'|
'indeterminate'|
'in-range'|
'invalid'|
'lang'|
'last-child'|
'last-of-type'|
'link'|
'not'|
'nth-child'|
'nth-last-child'|
'nth-last-of-type'|
'nth-of-type'|
'only-child'|
'only-of-type'|
'optional'|
'out-of-range'|
'placeholder-shown'|
'read-only'|
'read-write'|
'required'|
'root'|
'scope'|
'target'|
'target-within'|
'user-invalid'|
'valid'|
'visited'|
// Logical Combinations
'is'|
'where'