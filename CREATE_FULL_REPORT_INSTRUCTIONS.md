# Creating Full Case Report Template

## Goal
Create a Full Report that uses the SAME design as the Basic Report, but includes an Investigator Conclusions section.

## Approach
Since the full file is too large to create in one go, we'll:

1. **Copy the Basic Report HTML generation from JavaScript** (`generatePrintableHTML` function)
2. **Convert it to PHP** for server-side rendering
3. **Add the Conclusions section** in a prominent position
4. **Use exact same styles** as Basic Report

## Where to Insert Conclusions Section

After the "Case Description" section and before "Accused Persons", add:

```php
<!-- INVESTIGATOR CONCLUSIONS - PROMINENT SECTION -->
<?php if (!empty($conclusions)): ?>
<div class="report-section conclusion-section-highlight">
    <h2 class="section-header" style="background: #e74c3c; color: white; padding: 12px 15px; margin: -20px -20px 20px -20px;">
        <span class="section-icon"></span>
        INVESTIGATOR CONCLUSIONS & FINDINGS
    </h2>
    <div class="section-body">
        <?php foreach ($conclusions as $conclusion): ?>
        <div class="conclusion-card">
            <div class="conclusion-header-info">
                <h4><?= esc($conclusion['conclusion_title']) ?></h4>
                <div class="conclusion-meta">
                    <strong>Investigator:</strong> <?= esc($conclusion['investigator_name']) ?> 
                    (Badge: <?= esc($conclusion['badge_number']) ?>)
                    <br>
                    <strong>Date:</strong> <?= date('d M Y, H:i', strtotime($conclusion['updated_at'])) ?>
                </div>
            </div>
            
            <div class="conclusion-field">
                <label>Investigation Findings:</label>
                <div class="content"><?= nl2br(esc($conclusion['findings'])) ?></div>
            </div>
            
            <?php if (!empty($conclusion['recommendations'])): ?>
            <div class="conclusion-field">
                <label>Recommendations:</label>
                <div class="content"><?= nl2br(esc($conclusion['recommendations'])) ?></div>
            </div>
            <?php endif; ?>
            
            <div class="conclusion-field">
                <label>Conclusion Summary:</label>
                <div class="content"><?= nl2br(esc($conclusion['conclusion_summary'])) ?></div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>
<?php endif; ?>
```

## Alternative Simpler Approach

Instead of creating a separate PHP view, we can:
1. Fetch the report data via API
2. Use JavaScript to generate the HTML (like Basic Report does)
3. Just add the conclusions section to the existing `generatePrintableHTML` function

This is much simpler and maintains consistency!

## Implementation

Modify `public/assets/js/case-report.js` to:
1. Create a new function `generateFullReportHTML` based on `generatePrintableHTML`
2. Add conclusions section after case description
3. Call this function from `viewFullReportInBrowser`

This way:
- ✅ Uses same design and styles
- ✅ No need for separate PHP template
- ✅ Maintains all features (letterhead, photos, QR code)
- ✅ Just adds conclusions section
