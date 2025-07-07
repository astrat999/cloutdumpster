export function infiniteScroll(node: HTMLElement, callback: () => void) {
	let observer: IntersectionObserver;

	if (typeof IntersectionObserver !== 'undefined') {
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						callback();
					}
				});
			},
			{
				threshold: 0.1,
				rootMargin: '100px'
			}
		);

		observer.observe(node);
	}

	return {
		destroy() {
			if (observer) {
				observer.disconnect();
			}
		}
	};
}
