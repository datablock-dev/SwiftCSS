export interface Config {
    fileExtensions: any[string]
    directories: any[string]
    input: string
    output: string
    screens: {
        [key: string]: {[key: string]: number}
    }
}

export interface MediaQueries {
    [key: string]: {
        parent: string
        value: any[]
    }
}

export interface DynamicClasses {
    [key: string]: {
        property: string
        value: string
        pseudoClass: string | null
    }
}

export interface modeAttributes {
    "style-dark": string[]
    "style-light": string[]
}

export interface modeStyle { // One exists for style-dark and one for style-light
    [key: string]: string[]
}

export interface pseudoThemeClasses {
    [key: string]: [string] | string[]
}

export interface BaseStyle {
    [key: string]: string[]
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