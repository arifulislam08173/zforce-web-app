import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import "./company.css";

const CompanyForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState({
    name: "",
    address: "",
    contactNo: "",
    email: "",
    binNo: "",
    tiinNo: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      setLoading(true);
      try {
        const res = await api.get(`/companies/${id}`);
        setForm({
          name: res.data?.data?.name || "",
          address: res.data?.data?.address || "",
          contactNo: res.data?.data?.contactNo || "",
          email: res.data?.data?.email || "",
          binNo: res.data?.data?.binNo || "",
          tiinNo: res.data?.data?.tiinNo || "",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Name is required");

    if (isEdit) await api.put(`/companies/${id}`, form);
    else await api.post("/companies", form);

    navigate("/company");
  };

  if (loading) return <Loader />;

  return (
    <div className="co-page">
      <div className="co-header">
        <div>
          <h2 className="co-title">{isEdit ? "Edit Company" : "Add Company"}</h2>
          <p className="co-subtitle">Company master information</p>
        </div>
        <div className="co-actions">
          <button className="co-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
        </div>
      </div>

      <form className="co-card co-form" onSubmit={submit}>
        <div className="full">
          <label>Name</label>
          <input className="co-input" value={form.name} onChange={(e) => onChange("name", e.target.value)} />
        </div>

        <div>
          <label>Contact No</label>
          <input className="co-input" value={form.contactNo} onChange={(e) => onChange("contactNo", e.target.value)} />
        </div>
        <div>
          <label>Email</label>
          <input className="co-input" value={form.email} onChange={(e) => onChange("email", e.target.value)} />
        </div>

        <div>
          <label>BIN</label>
          <input className="co-input" value={form.binNo} onChange={(e) => onChange("binNo", e.target.value)} />
        </div>
        <div>
          <label>TIN</label>
          <input className="co-input" value={form.tiinNo} onChange={(e) => onChange("tiinNo", e.target.value)} />
        </div>

        <div className="full">
          <label>Address</label>
          <textarea
            className="co-input"
            rows={4}
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </div>

        <div className="full" style={{ display: "flex", gap: 10 }}>
          <button className="co-btn primary" type="submit">
            <FiSave /> Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;
