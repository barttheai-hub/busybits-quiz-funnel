const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'sponsors.json');

class CRM {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return { sponsors: [], metadata: {} };
    }
  }

  save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
  }

  getAll() {
    return this.data.sponsors;
  }

  getByStatus(status) {
    return this.data.sponsors.filter(s => s.status === status);
  }

  getById(id) {
    return this.data.sponsors.find(s => s.id === id);
  }

  updateStatus(id, newStatus) {
    const sponsor = this.getById(id);
    if (!sponsor) return null;
    
    const oldStatus = sponsor.status;
    sponsor.status = newStatus;
    this.save();
    return { sponsor, oldStatus, newStatus };
  }

  recordTouch(id, type = 'email') {
    const sponsor = this.getById(id);
    if (!sponsor) return null;

    sponsor.touchCount++;
    sponsor.lastContact = new Date().toISOString();
    
    // Schedule follow-up for 7 days later
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 7);
    sponsor.nextFollowUp = followUp.toISOString();

    this.save();
    return sponsor;
  }

  getFollowUpsDue() {
    const now = new Date().toISOString();
    return this.data.sponsors.filter(s => {
      if (!s.nextFollowUp) return false;
      return s.nextFollowUp <= now && s.status !== 'Closed' && s.status !== 'Live';
    });
  }

  getPipeline() {
    const stages = ['Prospect', 'Contacted', 'Negotiating', 'Closed', 'Live'];
    const pipeline = {};
    stages.forEach(stage => {
      pipeline[stage] = this.getByStatus(stage);
    });
    return pipeline;
  }

  addNote(id, note) {
    const sponsor = this.getById(id);
    if (!sponsor) return null;
    
    sponsor.notes = sponsor.notes 
      ? `${sponsor.notes}\n[${new Date().toISOString()}] ${note}`
      : `[${new Date().toISOString()}] ${note}`;
    this.save();
    return sponsor;
  }

  getStats() {
    const pipeline = this.getPipeline();
    return {
      total: this.data.sponsors.length,
      byStatus: Object.fromEntries(
        Object.entries(pipeline).map(([k, v]) => [k, v.length])
      ),
      followUpsDue: this.getFollowUpsDue().length,
      touchCountTotal: this.data.sponsors.reduce((sum, s) => sum + s.touchCount, 0)
    };
  }
}

module.exports = CRM;