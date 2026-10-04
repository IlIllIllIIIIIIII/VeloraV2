import{l,s as u}from"./Bb5XChYg.js";const f="https://www.google.com";function i(){try{return window.top.document,window.top??window}catch{return window}}function d(){const e=i();return e?e.location.href:"/"}function w(){const e=i()?.document,t=e?.querySelector('link[rel~="icon"]')??null;return{title:e?.title||"Classroom",icon:t?.href||""}}function r({fixedIframe:e}){const{title:t,icon:n}=w(),o=n?`<link rel="icon" href="${n}" />`:"";return`<!DOCTYPE html>
<html>
	<head>
		<title>${t}</title>
		${o}
		<style>
			html, body { margin: 0; height: 100%; overflow: hidden; background: #000; }
			iframe { ${e?"position: fixed; inset: 0;":""} width: 100vw; height: 100vh; border: 0; }
		</style>
	</head>
	<body>
		<iframe src="${d()}" allow="fullscreen" allowfullscreen></iframe>
	</body>
</html>`}function s(){i()?.location.replace(f)}function m(){const e=window.open("about:blank","_blank");return e?(e.document.documentElement.innerHTML=r({fixedIframe:!1}),e.document.close(),s(),!0):!1}function b(){const e=new Blob([r({fixedIframe:!0})],{type:"text/html"}),t=URL.createObjectURL(e);return window.open(t)?(s(),!0):(URL.revokeObjectURL(t),!1)}function a(e){e.preventDefault()}function p(e){const t=i();if(!t)return;const n=t;if(e){if(n.__galaxyAntiClose)return;n.__galaxyAntiClose=a,t.addEventListener("beforeunload",a)}else n.__galaxyAntiClose&&(t.removeEventListener("beforeunload",n.__galaxyAntiClose),n.__galaxyAntiClose=null)}function c(e,t){const n=i()?.document;if(n&&(e&&(n.title=e),t)){let o=n.querySelector('link[rel~="icon"]');o||(o=n.createElement("link"),o.rel="icon",n.head.appendChild(o)),o.href=t}}async function k(e,t){await u("tabPreset",{name:e,icon:t}),c(e,t)}async function h(){const e=await l("tabPreset",null);e&&(e.name||e.icon)&&c(e.name,e.icon)}async function v(){if(await h(),p(await l("antiClose",!1)),window.self!==window.top)return;const[e,t]=await Promise.all([l("autoAB",!1),l("autoBlob",!1)]);e?m():t&&b()}export{v as a,b,p as c,m as o,k as s};
