/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="mdast-util-directive" />

// NOTE: mdast type issue (2024-05-22)
declare module 'mdast' {
  type Node = any;
  type Paragraph = any;
  type Parent = any;
  type Root = any;
}
