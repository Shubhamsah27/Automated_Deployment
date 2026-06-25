const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/index.js');

describe('PulseAPI Routes', () => {
  let deployments;

  beforeAll(() => {
    const deploymentsPath = path.join(__dirname, '../deployments.json');
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  });

  it('GET /health should return status ok, version, and uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('uptime_seconds');
    expect(typeof res.body.uptime_seconds).toBe('number');
  });

  it('GET /metrics should return requests served, uptime, and deploy count', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('requests_served');
    expect(typeof res.body.requests_served).toBe('number');
    expect(res.body).toHaveProperty('uptime_seconds');
    expect(typeof res.body.uptime_seconds).toBe('number');
    expect(res.body).toHaveProperty('deploy_count', deployments.length);
  });

  it('GET /deployments should return the deployments array matching deployments.json', async () => {
    const res = await request(app).get('/deployments');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual(deployments);
  });

  it('GET / should return the dynamically rendered dashboard HTML', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    
    const html = res.text;
    
    // Check that mockup defaults are GONE
    expect(html).not.toMatch('99.97<span class="unit">%</span>');
    expect(html).not.toMatch('14d 6h continuous');
    expect(html).not.toMatch('0 manual · 27 automated');
    expect(html).not.toMatch('var deployTotal = 27;');
    expect(html).not.toMatch('data-count="48612"');
    
    // Check that live data is PRESENT
    const currentDeploy = deployments[0];
    if (currentDeploy) {
      expect(html).toContain(`sha-${currentDeploy.sha}`);
      expect(html).toContain(`>${currentDeploy.branch}<`);
      expect(html).toContain(currentDeploy.commit_message);
    }
    
    expect(html).toContain(`var deployTotal = ${deployments.length};`);
    expect(html).toMatch(/started .* ago · 0 unplanned restarts/);
  });
});
