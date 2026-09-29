export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'www.fidelesconfeitaria.online') {
    return Response.redirect(`https://fidelesconfeitaria.online${url.pathname}${url.search}`, 301);
  }
  return context.next();
}
