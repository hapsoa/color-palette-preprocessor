import _ = require("lodash");
import fs = require("fs");

const rawData = require("./19983881105_e93c2d8279_b.jpg.json");

interface Node {
  Ind: number;
  Type: string;
  Lind: number;
  Rind: number;
  NumLeaves: number;
  R: number;
  G: number;
  B: number;
  Ward: number;
  Sse: number;
  Var: number;
  Std: number;
  NumClusterSamples: number;
  parentInd: number | null;
  depth: number | null;
  leftRightInfoList: string[];
  // d3.js hierarchical visualization을 위한 데이터 속성
  name: string;
  value?: number;
  children?: Node[];
}

interface NodesDict {
  [nodeId: number]: Node;
}

init();

function init() {
  const nodes: Node[] = _.map(rawData, datum => {
    return {
      Ind: datum.Ind,
      Type: datum.Type,
      Lind: datum.Lind,
      Rind: datum.Rind,
      NumLeaves: datum.NumLeaves,
      R: datum.R,
      G: datum.G,
      B: datum.B,
      Ward: datum.Ward,
      Sse: datum.Sse,
      Var: datum.Var,
      Std: datum.Std,
      NumClusterSamples: datum.NumClusterSamples,
      parentInd: null,
      depth: null,
      leftRightInfoList: [],
      name: String(datum.Ind)
    };
  });

  const nodesDict: NodesDict = _.keyBy(nodes, node => node.Ind);

  // parent를 구한다.
  _.forEach(nodes, node => {
    if (nodesDict.hasOwnProperty(node.Lind)) {
      nodesDict[node.Lind].parentInd = node.Ind;
    }
    if (nodesDict.hasOwnProperty(node.Rind)) {
      nodesDict[node.Rind].parentInd = node.Ind;
    }
  });

  // root를 구한다.
  const rootNode: Node = _.filter(nodes, node => node.parentInd === null)[0];

  // 각 node마다 depth를 구한다.
  _.forEach(nodes, node => {
    node = makeNodeDepthAndLeftRightInfoList(node, nodesDict);
  });

  // 데이터를 새로운 형식으로 만든다.
  const newDatum: Node = makeDataStructure(nodesDict, rootNode);

  // console.log("newDatum", newDatum);
  fs.writeFileSync("newDatum.json", JSON.stringify(newDatum));

  // console.log("!", nodes);
}

function makeDataStructure(nodesDict: NodesDict, rootNode: Node): Node {
  const node = _.cloneDeep(rootNode);

  if (node.Lind !== 0 || node.Rind !== 0) {
    node.children = [];
    if (node.Lind !== 0) {
      const leftChildNode = makeDataStructure(nodesDict, nodesDict[node.Lind]);
      node.children.push(leftChildNode);
    }

    if (node.Rind !== 0) {
      const rightChildNode = makeDataStructure(nodesDict, nodesDict[node.Rind]);
      node.children.push(rightChildNode);
    }
  } else {
    node.value = node.NumClusterSamples;
  }

  return node;
}

function makeNodeDepthAndLeftRightInfoList(
  node: Node,
  nodesDict: NodesDict
): Node {
  let currentNode: Node = node;
  let depth: number = 0;
  const leftRightInfoList: string[] = [];

  while (currentNode.parentInd !== null) {
    depth += 1;
    const parentNode: Node = nodesDict[currentNode.parentInd];

    if (currentNode.Ind === parentNode.Lind) {
      leftRightInfoList.unshift("left");
    } else if (currentNode.Ind === parentNode.Rind) {
      leftRightInfoList.unshift("right");
    }

    currentNode = parentNode;
  }

  node.depth = depth;
  node.leftRightInfoList = leftRightInfoList;

  return node;
}
