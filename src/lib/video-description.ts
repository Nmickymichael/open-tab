export function cleanVideoDescription(value:string|null|undefined):string{
 if(!value)return "";
 return value
  .replace(/[^.!?\n]*(?:appeared|featured|ranked|listed)\s+in\s+YouTube(?:'s|’s)\s+most popular charts?[^.!?\n]*(?:[.!?]|$)/gi," ")
  .replace(/YouTube(?:'s|’s)\s+most popular charts?[^.!?\n]*(?:[.!?]|$)/gi," ")
  .replace(/\b(?:[A-Z]{2}\s*,\s*)+[A-Z]{2}\b/g," ")
  .replace(/\s+([,.;:!?])/g,"$1")
  .replace(/([.!?])\s*[.!?]+/g,"$1")
  .replace(/\s+/g," ")
  .trim();
}
