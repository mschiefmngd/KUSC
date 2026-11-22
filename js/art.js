/* 직무 캐릭터 그림 chr() — index.html, admin.html 공통 */
const J={VC:{c:"#FF7A1A"},PM:{c:"#F04452"},BP:{c:"#D99A00"},CS:{c:"#00A3A3"},PE:{c:"#7B61FF"},IB:{c:"#3182F6"}};
/* 공통 얼굴 */
function faceParts(){
  return `<circle class="skin" cx="60" cy="54" r="30"/>
  <circle class="eye" cx="50" cy="57" r="3.3"/><circle class="eye" cx="70" cy="57" r="3.3"/>
  <ellipse class="ck" cx="43" cy="65" rx="5" ry="3"/><ellipse class="ck" cx="77" cy="65" rx="5" ry="3"/>
  <path class="mouth" d="M53 68 Q60 74 67 68"/>`;
}
const HAIR=`<path class="hair" d="M30 52 Q30 22 60 22 Q90 22 90 52 Q84 36 62 36 Q44 36 36 46 Q33 49 30 52Z"/>`;
/* 직무별 소품 */
function props(k,c){
  switch(k){
  case "IB": return {head:HAIR,body:`<polygon points="60,82 54,90 60,118 66,90" fill="#1E3A8A"/><rect x="82" y="104" width="26" height="20" rx="4" fill="#7A5230"/><rect x="90" y="99" width="10" height="7" rx="2" fill="none" stroke="#7A5230" stroke-width="3"/>`};
  case "PE": return {head:`<path d="M28 46 Q28 18 60 18 Q92 18 92 46Z" fill="#FFC531"/><rect x="22" y="43" width="76" height="8" rx="4" fill="#F2A900"/><rect x="56" y="18" width="8" height="25" rx="3" fill="#F2A900"/>`,
     body:`<rect x="38" y="94" width="44" height="8" rx="3" fill="#FFC531" opacity=".9"/><rect x="38" y="108" width="44" height="8" rx="3" fill="#FFC531" opacity=".9"/>`};
  case "VC": return {head:HAIR+`<rect x="30" y="38" width="60" height="6" rx="3" fill="#7A4B2A"/><circle cx="47" cy="40" r="9" fill="#9AD8FF" stroke="#7A4B2A" stroke-width="3"/><circle cx="73" cy="40" r="9" fill="#9AD8FF" stroke="#7A4B2A" stroke-width="3"/>`,
     body:`<path d="M94 92 l6 -16 l6 16 l-6 -3z" fill="#F04452"/><rect x="96" y="90" width="8" height="24" rx="4" fill="#FFFFFF" stroke="#C9CFD6" stroke-width="1.5"/><path d="M96 112 l-4 8 h16 l-4 -8z" fill="#FFC531"/>`};
  case "CS": return {head:HAIR+`<circle cx="50" cy="57" r="9" fill="none" stroke="#2B3036" stroke-width="2.6"/><circle cx="70" cy="57" r="9" fill="none" stroke="#2B3036" stroke-width="2.6"/><line x1="59" y1="57" x2="61" y2="57" stroke="#2B3036" stroke-width="2.6"/>`,
     body:`<rect x="78" y="92" width="28" height="34" rx="4" fill="#F4E3C3"/><rect x="86" y="88" width="12" height="7" rx="2" fill="#8A8F96"/><line x1="83" y1="103" x2="101" y2="103" stroke="#B9A57E" stroke-width="2.4"/><line x1="83" y1="110" x2="101" y2="110" stroke="#B9A57E" stroke-width="2.4"/><line x1="83" y1="117" x2="95" y2="117" stroke="#B9A57E" stroke-width="2.4"/>`};
  case "BP": return {head:HAIR+`<rect x="40" y="50" width="16" height="12" rx="3" fill="none" stroke="#2B3036" stroke-width="2.4"/><rect x="64" y="50" width="16" height="12" rx="3" fill="none" stroke="#2B3036" stroke-width="2.4"/><line x1="56" y1="55" x2="64" y2="55" stroke="#2B3036" stroke-width="2.4"/>`,
     body:`<rect x="76" y="90" width="34" height="30" rx="5" fill="#FFFFFF"/><rect x="82" y="106" width="6" height="9" rx="1.5" fill="#3182F6"/><rect x="91" y="100" width="6" height="15" rx="1.5" fill="#F04452"/><rect x="100" y="95" width="6" height="20" rx="1.5" fill="#00A36C"/>`};
  case "PM": return {head:`<path d="M28 48 Q28 20 60 20 Q92 20 92 48Z" fill="${c}"/><rect x="18" y="44" width="34" height="7" rx="3.5" fill="${c}"/><circle cx="60" cy="22" r="4" fill="#FFFFFF"/>`,
     body:`<rect x="84" y="90" width="22" height="36" rx="5" fill="#2B3036"/><rect x="87" y="94" width="16" height="25" rx="2" fill="#9AD8FF"/><rect x="90" y="99" width="10" height="5" rx="1.5" fill="#FFFFFF"/><rect x="90" y="107" width="7" height="5" rx="1.5" fill="#FFFFFF"/>`};
  default: return {head:`<ellipse cx="60" cy="27" rx="25" ry="15" fill="#FFFFFF" stroke="#D6DADF" stroke-width="2"/><circle cx="45" cy="24" r="10" fill="#FFFFFF"/><circle cx="75" cy="24" r="10" fill="#FFFFFF"/><rect x="38" y="30" width="44" height="12" rx="3" fill="#FFFFFF" stroke="#D6DADF" stroke-width="2"/>`,
     body:`<rect x="44" y="90" width="32" height="30" rx="6" fill="#FFFFFF" opacity=".92"/><circle cx="96" cy="104" r="9" fill="#F7B3C2"/><path d="M88 106 h16 l-3 12 h-10z" fill="#C8A27A"/>`};
  }
}
function chr(k){
  const c=J[k].c, p=props(k,c);
  return `<svg class="chr" viewBox="0 0 120 140" aria-hidden="true">
    <ellipse class="sh" cx="60" cy="133" rx="36" ry="6"/>
    <rect x="28" y="80" width="64" height="54" rx="26" fill="${c}"/>
    ${p.body}${faceParts()}${p.head}</svg>`;
}
