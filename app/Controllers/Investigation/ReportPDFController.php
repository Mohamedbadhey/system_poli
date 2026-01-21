<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;
use App\Libraries\PDFGenerator;

class ReportPDFController extends ResourceController
{
    protected $format = 'json';
    protected $pdfGenerator;

    public function __construct()
    {
        $this->pdfGenerator = new PDFGenerator();
    }

    /**
     * Generate PDF for a report
     */
    public function generate($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        try {
            $path = $this->pdfGenerator->generateReportPDF($reportId);
            
            return $this->respond([
                'status' => 'success',
                'message' => 'PDF generated successfully',
                'data' => [
                    'path' => $path,
                    'filename' => basename($path)
                ]
            ]);
        } catch (\Exception $e) {
            return $this->fail('Failed to generate PDF: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Download report as PDF
     */
    public function download($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        try {
            $filePath = $this->pdfGenerator->downloadReport($reportId);
            
            return $this->response->download($filePath, null)->setFileName(basename($filePath));
        } catch (\Exception $e) {
            return $this->fail('Failed to download PDF: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Preview report as HTML (printable)
     */
    public function preview($reportId = null)
    {
        if (!$reportId) {
            return $this->failNotFound('Report ID is required');
        }

        try {
            $html = $this->pdfGenerator->generatePrintableHTML($reportId);
            
            return $this->response
                ->setContentType('text/html')
                ->setBody($html);
        } catch (\Exception $e) {
            return $this->fail('Failed to generate preview: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Generate PDFs for multiple reports (batch)
     */
    public function batchGenerate()
    {
        $data = $this->request->getJSON(true);
        $reportIds = $data['report_ids'] ?? [];

        if (empty($reportIds)) {
            return $this->fail('No report IDs provided', 400);
        }

        try {
            $results = $this->pdfGenerator->generateBatchPDF($reportIds);
            
            $successCount = count(array_filter($results, fn($r) => $r['success']));
            $failCount = count($results) - $successCount;
            
            return $this->respond([
                'status' => 'success',
                'message' => "Generated {$successCount} PDFs successfully, {$failCount} failed",
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return $this->fail('Batch generation failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Generate preview PDF from report data (before saving)
     */
    public function previewFromData()
    {
        $data = $this->request->getJSON(true);

        $rules = [
            'case_id' => 'required|integer',
            'report_type' => 'required',
            'content' => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }

        try {
            $html = $this->pdfGenerator->generatePDFFromData(
                $data['report_type'],
                $data['case_id'],
                $data['content'],
                $data['metadata'] ?? []
            );
            
            return $this->response
                ->setContentType('text/html')
                ->setBody($html);
        } catch (\Exception $e) {
            return $this->fail('Failed to generate preview: ' . $e->getMessage(), 500);
        }
    }
}
