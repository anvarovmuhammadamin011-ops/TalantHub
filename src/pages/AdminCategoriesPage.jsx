import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import EmptyState from "../components/ui/EmptyState";
import { useT } from "../context/I18nContext";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-accent outline-none";
const btnSecondary = "px-3 py-1.5 bg-surface text-ink-2 border border-border rounded-lg text-xs font-medium hover:bg-border-soft transition-colors";

export default function AdminCategoriesPage() {
  const { t } = useT();
  const [categories, setCategories] = useState([]);
  const [typeTab, setTypeTab] = useState("category");
  const [newCategory, setNewCategory] = useState({ group_name: "IT", name: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const data = await api(`/admin/categories?type=${typeTab}`);
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [typeTab]);

  const createCategory = async () => {
    if (!newCategory.name.trim()) return;
    try {
      await api("/admin/categories", { method: "POST", body: { ...newCategory, type: typeTab } });
      setNewCategory({ group_name: "IT", name: "" });
      load();
    } catch (err) {
      alert(err.message || t("common.error"));
    }
  };

  const toggleActive = async (c) => {
    try {
      await api(`/admin/categories/${c.id}`, { method: "PATCH", body: { active: !c.active } });
      load();
    } catch (err) {
      alert(err.message || t("common.error"));
    }
  };

  const rename = async (c) => {
    const name = window.prompt(t("pages.adminCategories.renamePrompt"), c.name);
    if (!name || !name.trim() || name.trim() === c.name) return;
    try {
      await api(`/admin/categories/${c.id}`, { method: "PATCH", body: { name: name.trim() } });
      load();
    } catch (err) {
      alert(err.message || t("common.error"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("pages.adminCategories.deleteConfirm"))) return;
    try {
      await api(`/admin/categories/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message || t("common.error"));
    }
  };

  if (loading) {
    return <div className="px-4 sm:px-6 lg:px-8 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  return (
    <div>
      <AdminHeader title={t("admin.categories")} />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => setTypeTab("category")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeTab === "category" ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"}`}>{t("pages.adminCategories.tabDirections")}</button>
          <button onClick={() => setTypeTab("skill")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeTab === "skill" ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"}`}>{t("pages.adminCategories.tabSkills")}</button>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-ink mb-4">{typeTab === "category" ? t("pages.adminCategories.addDirectionTitle") : t("pages.adminCategories.addSkillTitle")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {typeTab === "category" && (
              <select value={newCategory.group_name} onChange={(e) => setNewCategory({ ...newCategory, group_name: e.target.value })} className={inputCls}>
                <option value="IT">IT</option>
                <option value="Ta'lim">Ta'lim</option>
              </select>
            )}
            <input
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder={typeTab === "category" ? t("pages.adminCategories.namePlaceholderDirection") : t("pages.adminCategories.namePlaceholderSkill")}
              className={`${inputCls} sm:col-span-2`}
            />
          </div>
          <button onClick={createCategory} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
            <Plus className="w-4 h-4" /> {t("pages.adminCategories.add")}
          </button>
        </div>

        {categories.length === 0 ? (
          <EmptyState icon="🗂️" title={t("pages.adminCategories.emptyTitle")} description={t("pages.adminCategories.emptyDescription")} />
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-3 border-b border-border-soft">
                    {typeTab === "category" && <th className="px-5 py-3 font-medium">{t("pages.adminCategories.colGroup")}</th>}
                    <th className="px-3 py-3 font-medium">{t("pages.adminCategories.colName")}</th>
                    <th className="px-3 py-3 font-medium">{t("common.status")}</th>
                    <th className="px-5 py-3 text-right font-medium">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} className="border-b border-border-soft last:border-0 hover:bg-surface/60 transition-colors">
                      {typeTab === "category" && <td className="px-5 py-3 text-ink-2">{c.group_name}</td>}
                      <td className="px-3 py-3 text-ink font-medium">{c.name}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.active ? "bg-success-soft text-success" : "bg-surface text-ink-3"}`}>
                          {c.active ? t("pages.adminCategories.visible") : t("pages.adminCategories.hidden")}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => rename(c)} className={btnSecondary}>{t("pages.adminCategories.rename")}</button>
                          <button onClick={() => toggleActive(c)} className={btnSecondary}>{c.active ? t("pages.adminCategories.hide") : t("pages.adminCategories.show")}</button>
                          <button onClick={() => remove(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-danger hover:bg-danger-soft transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
