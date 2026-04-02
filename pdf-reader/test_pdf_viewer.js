import * as pdfjsLib from "pdfjs-dist";
globalThis.pdfjsLib = pdfjsLib;
import { EventBus, PDFFindController } from "pdfjs-dist/web/pdf_viewer.mjs";
console.log(!!EventBus, !!PDFFindController);
