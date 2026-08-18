// Ambient module declaration for plain (non-module) CSS side-effect imports,
// e.g. `import "react-datepicker/dist/react-datepicker.css";`. Next.js's webpack
// loader handles these fine at build time; this just satisfies the TypeScript
// language service, which needs a declaration for every imported module.
declare module "*.css";
