import React from 'react';

// Original lightweight line icons. No network requests, icon font or external dependency.
const drawings={
 events:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15h3m3 0h2"/></>,
 tasks:<><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/></>,
 shopping:<><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M2 4h3l2.5 11h12l2-8H6"/></>,
 stock:<><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z M3 7l9 4 9-4M12 11v10M8 5l9 4"/></>,
 equipment:<><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 13h18M10 12v3h4v-3"/></>,
 ecocups:<><path d="M5 5h14l-1.5 14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 5ZM4 5h16M9 2h6"/><path d="M9 11h6"/></>,
 contacts:<><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2M4 10a2.5 2.5 0 0 0-2 5m18-5a2.5 2.5 0 0 1 2 5"/></>,
 shifts:<><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2M5 5l-2-2m16 2 2-2"/></>,
 feedback:<><path d="M20 11a8 8 0 0 1-8 8c-1.5 0-3-.4-4.2-1.1L3 20l1.4-4.8A8 8 0 1 1 20 11Z"/><path d="M8 11h8m-8 3h5"/></>,
 recipes:<><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M18 21V3c-4 3-5 7-5 11h5"/></>,
 finance:<><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M7 16h4M17 3v3"/></>,
 report:<><path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM15 2v6h5M8 12h8M8 16h8M8 20h5"/></>,
 posts:<><path d="m3 10 12-5v14L3 14v-4Zm12-2 4-2v12l-4-2M6 15l2 6h3"/></>,
 archives:<><path d="M3 7h7l2 2h9v11H3V7ZM3 7V4h7l2 3M9 14h6"/></>,
 camera:<><rect x="2" y="6" width="20" height="15" rx="3"/><path d="m7 6 1.5-3h7L17 6"/><circle cx="12" cy="13" r="3.5"/></>,
 home:<><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9ZM9 21v-7h6v7"/></>,
 settings:<><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="2" fill="currentColor" stroke="none"/></>,
 tent:<><path d="m12 3 10 17H2L12 3ZM12 3v17M3 20h18"/></>,
 chair:<><path d="M6 4v9h12V4M4 13h16v4H4zM6 17v4m12-4v4"/></>,
 food:<><rect x="3" y="10" width="18" height="9" rx="2"/><path d="M5 10a7 7 0 0 1 14 0M8 5l1-2m5 2 1-2"/></>,
 sound:<><path d="M4 10h4l6-5v14l-6-5H4v-4Zm13-2a6 6 0 0 1 0 8m2-11a10 10 0 0 1 0 14"/></>,
 light:<><path d="M9 18h6m-5 3h4m-5-5c0-3-4-4-4-9a7 7 0 0 1 14 0c0 5-4 6-4 9H9Z"/></>
};

export default function ModuleGlyph({kind='equipment'}){
 return <svg className="festapp-line-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{drawings[kind]||drawings.equipment}</svg>;
}
