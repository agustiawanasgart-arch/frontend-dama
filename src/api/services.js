import api from './client';

// AUTH
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// USERS
export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// COMPANIES
export const companiesAPI = {
  list: () => api.get('/companies'),
  get: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.patch(`/companies/${id}`, data),
};

// PROJECTS
export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// CLUSTERS
export const clustersAPI = {
  list: (params) => api.get('/clusters', { params }),
  get: (id) => api.get(`/clusters/${id}`),
  byProject: (projectId) => api.get(`/clusters/project/${projectId}`),
  create: (data) => api.post('/clusters', data),
  update: (id, data) => api.patch(`/clusters/${id}`, data),
  delete: (id) => api.delete(`/clusters/${id}`),
};

// UNITS
export const unitsAPI = {
  list: (params) => api.get('/units', { params }),
  get: (id) => api.get(`/units/${id}`),
  update: (id, data) => api.patch(`/units/${id}`, data),
  bulkCreate: (data) => api.post('/units/bulk', data),
};

// ASSIGNMENTS
export const assignmentsAPI = {
  list: (params) => api.get('/assignments', { params }),
  get: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.patch(`/assignments/${id}`, data),
  getPayments: (id) => api.get(`/assignments/${id}/payments`),
  createPayment: (id, data) => api.post(`/assignments/${id}/payments`, data),
};

// PROGRESS
export const progressAPI = {
  list: (params) => api.get('/progress', { params }),
  create: (data) => api.post('/progress', data),
  update: (id, data) => api.patch(`/progress/${id}`, data),
};

// DOCUMENTATION
export const documentationAPI = {
  list: (params) => api.get('/documentations', { params }),
  upload: (formData, config = {}) => api.post('/documentations', formData, {
    ...config,
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.patch(`/documentations/${id}`, data),
  delete: (id) => api.delete(`/documentations/${id}`),
};

// DASHBOARD
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
};

// TIMELINES
export const timelinesAPI = {
  list: (params) => api.get('/timelines', { params }),
  get: (id) => api.get(`/timelines/${id}`),
  create: (data) => api.post('/timelines', data),
  update: (id, data) => api.patch(`/timelines/${id}`, data),
  delete: (id) => api.delete(`/timelines/${id}`),
};

// HANDOVERS
export const handoversAPI = {
  list: (params) => api.get('/handovers', { params }),
  get: (id) => api.get(`/handovers/${id}`),
  create: (data) => api.post('/handovers', data),
  update: (id, data) => api.patch(`/handovers/${id}`, data),
  delete: (id) => api.delete(`/handovers/${id}`),
};

// RETENTIONS
export const retentionsAPI = {
  list: (params) => api.get('/retentions', { params }),
  get: (id) => api.get(`/retentions/${id}`),
  create: (data) => api.post('/retentions', data),
  update: (id, data) => api.patch(`/retentions/${id}`, data),
  delete: (id) => api.delete(`/retentions/${id}`),
};
