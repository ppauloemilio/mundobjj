/** Inline script to avoid theme flash before paint. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('mbjj_theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.removeAttribute('data-theme');}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
