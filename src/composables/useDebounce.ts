import { ref, watch } from "vue";
import type { Ref } from "vue";

export function useDebounce(source: Ref<string>, delay = 250) {
	const debounced = ref(source.value) as Ref<string>;
	let timer: ReturnType<typeof setTimeout> | null = null;

	watch(source, (val) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			debounced.value = val;
		}, delay);
	});

	return debounced;
}

export default useDebounce;
