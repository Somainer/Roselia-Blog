export const isTextNode = (node: Node): node is Text => node.nodeType === Node.TEXT_NODE
export const isElementNode = (node: Node): node is HTMLElement => node.nodeType === Node.ELEMENT_NODE
