export async function garminFetch(url) {
  try {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const headers = {
      accept: "application/json, text/plain, */*",
      nk: "NT",
      "x-app-ver": window.URL_BUST_VALUE || "",
      "x-lang": "fr-FR",
      "x-requested-with": "XMLHttpRequest",
      ...(csrf && { "connect-csrf-token": csrf }),
    };

    const resp = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers,
    });
    if (!resp.ok) {
      console.error("API Error", `HTTP ${resp.status} on ${url}`);
      const errText = await resp.text().catch(() => "<no body>");
      console.debug("Garmin API error body:", errText);
      return null;
    }
    const data = await resp.json();
    console.debug("Garmin API response for", url, data);
    return data;
  } catch (e) {
    console.error("API Exception", `Fetch for ${url}: ${e.message}`);
    return null;
  }
}
