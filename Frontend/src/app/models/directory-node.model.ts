export interface DirectoryNode {
  id: string;              // unique id
  parentId: string | null; // null = root (User)
  name: string;            // folder name
  x: number;               // position in grid space
  y: number;
}
