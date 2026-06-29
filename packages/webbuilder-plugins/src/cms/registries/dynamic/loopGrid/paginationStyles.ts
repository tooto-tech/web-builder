export const LOOP_GRID_PAGINATION_CSS = `
.wb-loop-grid-pagination{grid-column:1/-1;display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;padding:28px 0 4px;}
.wb-loop-grid-pagination>a,.wb-loop-grid-pagination>button,.wb-loop-grid-pagination>span{display:inline-flex;align-items:center;justify-content:center;width:22px;min-width:22px;height:22px;padding:0;border:0;border-radius:4px;background:transparent;color:#1b2a33;font-size:14px;font-weight:400;line-height:1;text-decoration:none;box-sizing:border-box;box-shadow:none;}
.wb-loop-grid-pagination svg{display:block;width:18px;height:18px;}
.wb-loop-grid-pagination>a,.wb-loop-grid-pagination>button{cursor:pointer;}
.wb-loop-grid-pagination>a:hover,.wb-loop-grid-pagination>button:hover{color:#2847f3;background:transparent;}
.wb-loop-grid-pagination>a.active,.wb-loop-grid-pagination>button.active,.wb-loop-grid-pagination>span.active,.wb-loop-grid-pagination>a.is-active,.wb-loop-grid-pagination>button.is-active,.wb-loop-grid-pagination>span.is-active{background:#2847f3;color:#fff;font-weight:500;}
`

export const LOOP_GRID_PAGINATION_STYLE = `
  <style data-wb-loop-grid-pagination-style>
    ${LOOP_GRID_PAGINATION_CSS}
  </style>
`

export const LOOP_GRID_PREV_ICON =
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

export const LOOP_GRID_NEXT_ICON =
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

export const LOOP_GRID_PAGINATION_SCRIPT = `
  <script data-wb-loop-grid-pagination-script>
    (function(){
      var prevIcon = ${JSON.stringify(LOOP_GRID_PREV_ICON)};
      var nextIcon = ${JSON.stringify(LOOP_GRID_NEXT_ICON)};
      function normalizePager(root){
        var pagers = (root || document).querySelectorAll('.wb-loop-grid-pagination');
        Array.prototype.forEach.call(pagers, function(pager){
          Array.prototype.forEach.call(pager.children, function(item){
            var text = (item.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase();
            if (text === 'prev' || text === 'previous' || text === '上一页' || text === '‹' || text === '«' || text.indexOf('prev') !== -1 || text.indexOf('previous') !== -1 || text.indexOf('上一页') !== -1 || text.indexOf('‹') !== -1 || text.indexOf('«') !== -1) {
              item.innerHTML = prevIcon;
              item.setAttribute('aria-label', '上一页');
            } else if (text === 'next' || text === 'next »' || text === 'next >' || text === '下一页' || text === '下一页 »' || text === '›' || text === '»' || text.indexOf('next') !== -1 || text.indexOf('下一页') !== -1 || text.indexOf('›') !== -1 || text.indexOf('»') !== -1) {
              item.innerHTML = nextIcon;
              item.setAttribute('aria-label', '下一页');
            }
          });
        });
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ normalizePager(document); });
      } else {
        normalizePager(document);
      }
      if (window.MutationObserver) {
        new MutationObserver(function(mutations){
          mutations.forEach(function(mutation){
            Array.prototype.forEach.call(mutation.addedNodes || [], function(node){
              if (node && node.nodeType === 1) normalizePager(node);
            });
          });
        }).observe(document.documentElement, { childList: true, subtree: true });
      }
    })();
  </script>
`
