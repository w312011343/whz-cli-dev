<template>
  <div ref="container" class="monaco-editor" :style="'height: ' + height + 'px'"></div>
</template>

<script setup>
import * as monaco from "monaco-editor";
import {
  MenuId,
  MenuRegistry,
} from "monaco-editor/esm/vs/platform/actions/common/actions";
import {
  defineProps,
  reactive,
  ref,
  watch,
  onBeforeUnmount,
  onMounted,
} from "vue";

const props = defineProps({
  language: {
    type: String,
    default: "json",
  },
  oldValue: String,
  value: String,
  visible: Boolean,
  height: {
    type: Number,
    default: 380,
  },

});

onMounted(() => {
  init();
})


watch(
  () => props.oldValue,
  (newValue) => {
    originalModel = monaco.editor.createModel(newValue, props.language);
    monacoDiffInstance.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
    init();
  },
  { deep: true }
);
watch(
  () => props.value,
  (newValue) => {
    modifiedModel = monaco.editor.createModel(newValue, props.language);
    monacoDiffInstance.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
    init();
  },
  { deep: true }
);
// watch(
//   () => props.visible,
//   (newValue) => {
//     newValue && nextTick(()=>{init()})
//   },
//   {
//     immediate: true,
//   }
// );
const defaultOpts = reactive({
  value: "",
  theme: "vs", // 编辑器主题：vs, hc-black, or vs-dark，更多选择详见官网
  roundedSelection: false, // 右侧不显示编辑器预览框
  autoIndent: true, // 自动缩进
  readOnly: true, // 是否只读
  diffWordWrap: true,
  wordWrap: 'on',
  automaticLayout: true,
  scrollBeyondLastLine: false,
  scrollbar: {
    verticalScrollbarSize: 0
  },
  minimap: { enabled: true },
  originalEditable: true,
  renderWhitespace: 'all', // 启用空白呈现
  formatOnType: true, // 类型格式化
  formatOnPaste: true, // 复制格式化
  foldingStrategy: 'indentation', // 代码可分小段折叠
  folding: true, // 是否启用代码折叠
  fontSize: 14,
  tabSize: 2, // tab 缩进长度
});
let originalModel;
let modifiedModel;
let monacoDiffInstance;
const container = ref(null);
function init() {
  // monaco.editor.defineTheme('IDLE', Theme);
  // monaco.editor.setTheme('IDLE')
  // 初始化编辑器实例
  monacoDiffInstance = monaco.editor.createDiffEditor(
    container.value,
    { ...defaultOpts, domNode: container.value }
  );
  originalModel = monaco.editor.createModel(
    JSON.stringify(JSON.parse(props.oldValue), null, "\t"),
    props.language
  );
  modifiedModel = monaco.editor.createModel(
    JSON.stringify(JSON.parse(props.value), null, "\t"),
    props.language
  );
  monacoDiffInstance.setModel({
    original: originalModel,
    modified: modifiedModel,
  });
  removeAllMenus();
  const originalEditor = monacoDiffInstance.getOriginalEditor();
  const modifiedEditor = monacoDiffInstance.getModifiedEditor();

  originalEditor.addAction(setAction(ed => {
    console.log('eeee===', ed);
    const { text, selection } = getSelectedText(originalEditor);
    addAnnotation({ editor: originalEditor, text, selection })

  }))

  modifiedEditor.addAction(setAction(ed => {
    console.log('eeee===', ed);
    const { text, selection } = getSelectedText(modifiedEditor);
    addAnnotation({editor:modifiedEditor,text,selection})
  }))
}



/**
 * 设置自定义事件
 * @param {*} cb 
 */
function setAction(cb) {
  return {
    id: 'addDesc',
    label: '标注',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1,
    run: cb,
  }
}

function addAnnotation({ editor, text, selection }) {
  const model = editor.getModel();
  
  addMarkerWithIcon(model, selection, text || '这是一个标注示例')

 

}

function addMarkerWithIcon(model, selection, message) {
  console.log('222222222222');
  
  const {
    startLineNumber,
    endLineNumber,
    startColumn,
    endColumn } = selection;

    let range = new monaco.Range(startLineNumber, startColumn, endLineNumber, endColumn);
    // let range = new monaco.Range(startLineNumber, 0, 0, 0);


// 应用新的标注

//  model.deltaDecorations([], [{
//     range: range,
//     options: {
//       id:111,
//       isWholeLine: true,
//       zIndex:1,
//       className:'green',
//       inlineClassName:'green',//高亮代码
//       glyphMarginClassName: 'myCustomGlyph', // 自定义类名，用于指定图标样式
//       hoverMessage: { value: message },
//       glyphMarginHoverMessage: { value: message },
//       glyphMarginHoverMessageSeverity: monaco.MarkerSeverity.Info,
//       linesDecorationsClassName: 'myCustomDecoration',
//       overviewRuler: {
//         color: '#007acc',
//         position: range.getStartPosition(),
//         position: monaco.editor.OverviewRulerLane.Right
//       },
//       overviewRulerLane: monaco.editor.OverviewRulerLane.Right,
//       className: 'myCustomDecoration',

//     }
//   }]);

const decorations =[{
    range: range,
    options: {
      id:111,
      isWholeLine: true,
      zIndex:1000,
      className:'green',
      inlineClassName:'green',//高亮代码
      // glyphMarginClassName: 'myCustomGlyph', // 自定义类名，用于指定图标样式
      hoverMessage: { value: message},
      glyphMarginHoverMessage: { value: message },
      glyphMarginHoverMessageSeverity: monaco.MarkerSeverity.Info,
      linesDecorationsClassName: 'myCustomDecoration',
      overviewRuler: {
        color: 'red'
        // position: monaco.editor.OverviewRulerLane.Right
      },
      overviewRulerLane: monaco.editor.OverviewRulerLane.Right,
      // className: 'myCustomDecoration',

    }
  }]

  const decorationIds = model.deltaDecorations([], decorations);

decorationIds.forEach((decorationId) => {
  const decoration = model.getDecorationRange(decorationId);
  if (decoration) {
    const position = model.getTopForLineNumber(decoration.startLineNumber);
    const overlayWidget = {
      domNode: createCustomOverlayNode(),
      position: { preference: [monaco.editor.OverlayWidgetPositionPreference.TOP_RIGHT_CORNER] },
    };
    model.addOverlayWidget(overlayWidget);
  }
});
  
}

/**
 * 获取选中内容
 * @param {*} editor 
 */
function getSelectedText(editor) {
  const selection = editor.getSelection();;
  const {
    startLineNumber,
    endLineNumber,
    startColumn,
    endColumn } = selection;
  const text = editor.getModel().getValueInRange(selection);
  console.log('选中的内容：', text);
  return {
    text,
    selection
  }
}
const removeAllMenus = () => {
  const contextMenuEntry = MenuRegistry._menuItems.get(MenuId.EditorContext);
  let node = contextMenuEntry._first;
  do {
    if (node.element) {
      contextMenuEntry._remove(node);
    }
    node = node.next;
  } while (node !== undefined);
};

function createCustomOverlayNode() {
  const domNode = document.createElement('div');
  domNode.textContent = 'Custom overlay content';
  domNode.style.backgroundColor = 'lightgray';
  domNode.style.position = 'absolute';
  domNode.style.top = '50px'; // Adjust top position as needed
  domNode.style.left = '50px !important'; // Adjust right position as needed
  return domNode;
}

onBeforeUnmount(() => {
  monacoDiffInstance.dispose()
})
</script>

<style lang="less">
.the-code-diff-editor-container {
  height: 100%;
  overflow: auto;

  .monaco-editor .scroll-decoration {
    box-shadow: none;
  }
}

.monaco-editor .view-line {
  text-align: left;
}

.myCustomGlyph,.myCustomDecoration {
  // background: black;
  // background: url('../assets/mark.png') no-repeat center center !important;
  // /* 指定图标样式 */
  // width: 16px !important;
  // /* 图标宽度 */
  // height: 16px !important;
  // /* 图标高度 */
  // display: inline-block;
  // padding-right: 10px;
  // z-index: 10000;
  // position: relative;
  //   margin-top: 2px;
}
// .monaco-editor .margin {
//   width: 16px !important;
//   left: 37px  !important;
// }
// .margin-view-overlays {
//   width: 16px !important;
// }
.green{
  background: rgb(114, 231, 114);
  width: 100%;
}
// .view-line{
//   background: rgba(255, 255, 255, 1) !important;
// }
</style>
