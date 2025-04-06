export function transformRoutePath(routePath) {
    return routePath
      ?.split('/')
      .map((segment) => (segment.startsWith(':') ? `{${segment.slice(1)}}` : segment))
      .join('/') || '';
  }