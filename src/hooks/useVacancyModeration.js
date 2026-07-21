import { useState } from "react";
import { api } from "../lib/api";

export function useVacancyModeration(onDone) {
  const [busyId, setBusyId] = useState(null);

  const approve = async (id) => {
    setBusyId(id);
    try {
      await api(`/admin/vacancies/${id}/status`, { method: "PATCH", body: { status: "Faol" } });
      await onDone();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    const reason = window.prompt("Tuzatish sababini kiriting:");
    if (!reason || !reason.trim()) return;
    setBusyId(id);
    try {
      await api(`/admin/vacancies/${id}/status`, { method: "PATCH", body: { status: "Tuzatish kerak", reject_reason: reason.trim() } });
      await onDone();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setBusyId(null);
    }
  };

  const archive = async (id) => {
    setBusyId(id);
    try {
      await api(`/admin/vacancies/${id}/status`, { method: "PATCH", body: { status: "Arxivlangan" } });
      await onDone();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Vakansiyani o'chirishni tasdiqlaysizmi? Bu amalni bekor qilib bo'lmaydi.")) return;
    setBusyId(id);
    try {
      await api(`/admin/vacancies/${id}`, { method: "DELETE" });
      await onDone();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setBusyId(null);
    }
  };

  return { busyId, approve, reject, archive, remove };
}
