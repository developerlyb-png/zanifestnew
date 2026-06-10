"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { IFeedbackItem } from '@/models/feedback';
import styles from "@/styles/components/superadminsidebar/feedbackadmin.module.css";
import { FaPlus, FaTrashAlt, FaEdit, FaTimes } from 'react-icons/fa';
import FeedBackSection from '../home/FeedBackSection';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader result is not a string'));
      }
    };
    reader.onerror = (err) => reject(err);
  });

interface EditModalState {
  isOpen: boolean;
  item: Partial<IFeedbackItem> | null;
  isNew: boolean;
}

// 🔹 Helper to render heading with <...> styled
const renderHeading = (heading: string) => {
  const parts = heading.split(/(<[^>]+>)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("<") && part.endsWith(">")) {
      return (
        <span key={idx} style={{ color: "orangered" }}>
          {part.replace(/[<>]/g, "")}
        </span>
      );
    }
    return <span key={idx} style={{ color: "black" }}>{part}</span>;
  });
};

const FeedbackAdmin: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<IFeedbackItem[]>([]);
  const [heading, setHeading] = useState<string>('What Our <Customers> Are Saying?');
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    item: null,
    isNew: false,
  });

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback');
      const data = await res.json();
      if (data.success) {
        setFeedbackList(data.data as IFeedbackItem[]);
        setHeading(data.heading || "What Our <Customers> Are Saying?");
      } else setError(data.message || 'Failed to fetch feedback.');
    } catch (e: any) {
      setError('Network error: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSaveHeading = async () => {
    try {
      const res = await fetch("/api/feedback", {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditingHeading(false);
        fetchFeedback();
      } else {
        alert(data.message || 'Failed to save heading.');
      }
    } catch {
      alert('Error saving heading.');
    }
  };

  const handleSave = async (item: Partial<IFeedbackItem>) => {
    const isNew = !item._id;
    try {
      const res = await fetch('/api/feedback', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        fetchFeedback();
        setEditModal({ isOpen: false, item: null, isNew: false });
      } else {
        alert(data.message);
      }
    } catch {
      alert('Error saving feedback.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      const res = await fetch('/api/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchFeedback();
      else alert(data.message);
    } catch {
      alert('Error deleting feedback.');
    }
  };

  const openEditModal = (item: IFeedbackItem) =>
    setEditModal({ isOpen: true, item, isNew: false });

  const openNewModal = () =>
    setEditModal({
      isOpen: true,
      item: { name: '', post: '', desc: '', image: '' },
      isNew: true,
    });

  const closeEditModal = () =>
    setEditModal({ isOpen: false, item: null, isNew: false });

  if (loading) return <div className={styles.cont}>Loading Admin...</div>;
  if (error) return <div className={styles.cont} style={{ color: 'red' }}>{error}</div>;

  return (
    <>
      <div className={styles.previewBox}>
        <h3>Live Preview</h3>
        {/* 🔹 अब Live preview props से आएगा */}
        <FeedBackSection liveHeading={heading} liveFeedbackList={feedbackList} />
      </div>

      <div className={styles.cont} style={{ padding: '40px', backgroundColor: '#f9f9f9' }}>
        <h2>Feedback Admin Panel</h2>

        <div style={{ marginBottom: '30px', padding: '15px', borderRadius: '4px' }}>
          {isEditingHeading ? (
            <div>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                style={{ width: '80%', padding: '8px', marginRight: '10px' }}
              />
              <button onClick={handleSaveHeading} style={{ marginRight: '5px' }}>Save</button>
              <button onClick={() => { setHeading("What Our <Customers> Are Saying?"); setIsEditingHeading(false); }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', flexDirection:"column" }}>
              <p style={{ fontWeight: 'bold', marginRight: '10px' }}>
                {renderHeading(heading)}
              </p>
              <button onClick={() => setIsEditingHeading(true)}><FaEdit /> Edit Heading</button>
            </div>
          )}
        </div>

        <button onClick={openNewModal} style={{ marginBottom: '20px' }}>
          <FaPlus /> Add New Card
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {feedbackList.map((item, index) => (
            <div key={String(item._id ?? index)} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '6px', width: '300px' }}>
              <Image src={item.image} alt={item.name} width={50} height={50} style={{ borderRadius: '50%' }} unoptimized />
              <strong>{item.name}</strong> - {item.post}
              <p>{item.desc}</p>
              <button onClick={() => openEditModal(item)}><FaEdit /> Edit</button>
              <button onClick={() => handleDelete(String(item._id))}><FaTrashAlt /> Delete</button>
            </div>
          ))}
        </div>

        {editModal.isOpen && editModal.item && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
              <button onClick={closeEditModal} className={styles.closeButton}><FaTimes /></button>
              <h3>{editModal.isNew ? 'Add Feedback' : 'Edit Feedback'}</h3>
              <form onSubmit={e => { e.preventDefault(); handleSave(editModal.item!); }}>
                <input type="text" placeholder="Name" value={editModal.item?.name || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, name: e.target.value } })} required />
                <input type="text" placeholder="Post" value={editModal.item?.post || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, post: e.target.value } })} required />
                <textarea placeholder="Description" value={editModal.item?.desc || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, desc: e.target.value } })} required />
                <input type="file" accept="image/*" onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const base64 = await fileToBase64(file);
                  setEditModal({ ...editModal, item: { ...editModal.item!, image: base64 } });
                }} required={editModal.isNew} />
                {editModal.item.image && (
                  <Image src={editModal.item.image} alt="Preview" width={100} height={100} unoptimized />
                )}
                <button type="submit">{editModal.isNew ? 'Add' : 'Save'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FeedbackAdmin;
