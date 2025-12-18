import { http } from "./http";
import type {
	CreateDocumentRequest,
	DocumentDetail,
	DocumentListItem,
} from "./types";

export const documentsApi = {
	getAll: (params?: any) =>
		http.get<DocumentListItem[]>("/documents", { params }),
	getById: (id: number | string) =>
		http.get<DocumentDetail>(`/documents/${id}`),
	create: (data: CreateDocumentRequest) =>
		http.post<DocumentDetail>("/documents", data),
	updateStatus: (id: number | string, status: string) =>
		http.patch<DocumentDetail>(`/documents/${id}/status`, { status }),
	cancel: (id: number | string) => http.delete(`/documents/${id}`),
	getAudit: (id: number | string) => http.get<any[]>(`/documents/${id}/audit`),
};
