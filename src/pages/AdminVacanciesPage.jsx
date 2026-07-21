import { useState, useEffect, useMemo } from "react";
import { api, downloadFile } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import FilterPills from "../components/admin/FilterPills";
import VacancyTable from "../components/admin/VacancyTable";
import { useVacancyModeration } from "../hooks/useVacancyModeration";
import { useAdminRealtime } from "../hooks/useAdminRealtime";
import { useT } from "../context/I18nContext";

const FILTERS = [
  { value: "" },
  { value: "Faol" },
  { value: "Kutilmoqda" },
  { value: "Tuzatish kerak" },
  { value: "Nofaol" },
  { value: "Arxivlangan" },
];

const PAGE_SIZE = 20;

export default function AdminVacanciesPage() {
  const { t } = useT();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    setError("");
    try {
      const data = await api("/admin/vacancies");
      setVacancies(data.vacancies || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useAdminRealtime(load);

  const { busyId, approve, reject, remove } = useVacancyModeration(load);

  const filterOptions = useMemo(
    () => FILTERS.map((f) => ({ value: f.value, label: f.value ? t(`status.${f.value}`) : t("common.all") })),
    [t]
  );

  const filtered = useMemo(() => {
    let list = vacancies;
    if (status) list = list.filter((v) => v.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((v) => v.title?.toLowerCase().includes(q) || v.company?.toLowerCase().includes(q));
    }
    return list;
  }, [vacancies, status, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const runExport = async () => {
    setExporting(true);
    try {
      await downloadFile("/admin/export/vacancies", "vakansiyalar.csv");
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="px-4 sm:px-6 lg:px-8 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  return (
    <div>
      <AdminHeader
        title={t("nav.vacancies")}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("pages.adminVacancies.searchPlaceholder")}
        onExport={runExport}
        exporting={exporting}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="p-5 border-b border-border-soft">
            <FilterPills options={filterOptions} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
          </div>
          <VacancyTable
            vacancies={paged}
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            onApprove={approve}
            onReject={reject}
            onDelete={remove}
            busyId={busyId}
          />
        </div>
      </div>
    </div>
  );
}
