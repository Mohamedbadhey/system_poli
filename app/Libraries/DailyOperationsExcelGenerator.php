<?php

namespace App\Libraries;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Exception;

class DailyOperationsExcelGenerator
{
    /**
     * Generate Daily Operations Excel Report
     * 
     * @param array $data Operations data
     * @param string $period Time period
     * @param string $date Date filter
     * @param string $language Language (en/so)
     * @return array Result with Excel URL and path
     */
    public function generateDailyOperationsReport($data, $period = 'today', $date = null, $language = 'en')
    {
        try {
            $spreadsheet = new Spreadsheet();
            
            // Set document properties
            $spreadsheet->getProperties()
                ->setCreator('Jubaland Police - Case Management System')
                ->setTitle('Daily Operations Report - ' . $date)
                ->setSubject('Daily Operations Report')
                ->setDescription('Daily operations report including cases, custody, and certificates');
            
            // Create sheets
            $this->createSummarySheet($spreadsheet, $data, $period, $date, $language);
            $this->createCasesSubmittedSheet($spreadsheet, $data['cases_submitted'], $language);
            $this->createCasesAssignedSheet($spreadsheet, $data['cases_assigned'], $language);
            $this->createCasesClosedSheet($spreadsheet, $data['cases_closed'], $language);
            $this->createCustodySheet($spreadsheet, $data['current_custody'], $language);
            $this->createCertificatesSheet($spreadsheet, $data['certificates_issued'], $language);
            $this->createMedicalFormsSheet($spreadsheet, $data['medical_forms_issued'], $language);
            
            // Set active sheet to summary
            $spreadsheet->setActiveSheetIndex(0);
            
            // Save to file
            $filename = 'daily-operations-' . $date . '-' . $period . '.xlsx';
            $basePath = FCPATH . 'uploads/reports/daily-operations/';
            
            if (!is_dir($basePath)) {
                mkdir($basePath, 0755, true);
            }
            
            $fullPath = $basePath . $filename;
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($fullPath);
            
            return [
                'success' => true,
                'filename' => $filename,
                'url' => '/uploads/reports/daily-operations/' . $filename,
                'full_url' => base_url('/uploads/reports/daily-operations/' . $filename),
                'file_path' => $fullPath
            ];
            
        } catch (Exception $e) {
            log_message('error', 'Daily Operations Excel Generation Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Create Summary Sheet
     */
    private function createSummarySheet($spreadsheet, $data, $period, $date, $language)
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($language === 'so' ? 'Guddiga' : 'Summary');
        
        $stats = $data['stats'];
        $periodLabel = $this->getPeriodLabel($period, $language);
        
        // LOGO / Banner
        $sheet->setCellValue('A1', $language === 'so' ? 'BOOLISKA JUBBALAND' : 'JUBALAND POLICE FORCE');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 20,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1e40af']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);
        $sheet->getRowDimension('1')->setRowHeight(40);
        
        // Title
        $sheet->setCellValue('A2', $language === 'so' ? 'Warbixinta Hawlaha Maalinta' : 'Daily Operations Report');
        $sheet->mergeCells('A2:F2');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '1e293b']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);
        $sheet->getRowDimension('2')->setRowHeight(30);
        
        // Date and Period
        $sheet->setCellValue('A3', $periodLabel . ' - ' . date('F d, Y', strtotime($date)));
        $sheet->mergeCells('A3:F3');
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['size' => 12, 'color' => ['rgb' => '64748b']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);
        
        // Executive Summary Section
        $row = 5;
        $sheet->setCellValue('A' . $row, $language === 'so' ? 'SOO KOOBID FULINTA' : 'EXECUTIVE SUMMARY');
        $sheet->mergeCells('A' . $row . ':F' . $row);
        $sheet->getStyle('A' . $row)->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2563eb']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER]
        ]);
        $sheet->getRowDimension($row)->setRowHeight(25);
        
        // Summary Text
        $row++;
        $total = $stats['cases_submitted_count'] + $stats['cases_assigned_count'] + $stats['cases_closed_count'];
        $summaryText = $language === 'so' 
            ? "Warbixintan waxay soo bandhigaysaa {$total} hawlood oo guud, oo ay ku jiraan {$stats['cases_submitted_count']} kiisas cusub, {$stats['cases_assigned_count']} kiisas loo xilsaaray, iyo {$stats['cases_closed_count']} kiisas la xiray. Hadda waxaa xabsiga ku jira {$stats['current_custody_count']} qof."
            : "This report presents {$total} total operations, including {$stats['cases_submitted_count']} new cases submitted, {$stats['cases_assigned_count']} cases assigned, and {$stats['cases_closed_count']} cases closed. Currently {$stats['current_custody_count']} individuals are in custody.";
        
        $sheet->setCellValue('A' . $row, $summaryText);
        $sheet->mergeCells('A' . $row . ':F' . $row);
        $sheet->getStyle('A' . $row)->getAlignment()->setWrapText(true);
        $sheet->getRowDimension($row)->setRowHeight(60);
        
        // Statistics Header
        $row += 2;
        $sheet->setCellValue('A' . $row, $language === 'so' ? 'TIROOYINKA HAWLAHA' : 'OPERATIONAL STATISTICS');
        $sheet->mergeCells('A' . $row . ':F' . $row);
        $sheet->getStyle('A' . $row)->applyFromArray([
            'font' => ['bold' => true, 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'f1f5f9']],
        ]);
        
        // Statistics Table
        $row++;
        $sheet->setCellValue('A' . $row, $language === 'so' ? 'Qeybta' : 'Metric');
        $sheet->setCellValue('B' . $row, $language === 'so' ? 'Tirooyin' : 'Count');
        $this->styleHeaderRow($sheet, 'A' . $row . ':B' . $row);
        
        $metrics = [
            [$language === 'so' ? 'Kiisaska La Soo Gudbiyay' : 'Cases Submitted', $stats['cases_submitted_count']],
            [$language === 'so' ? 'Kiisaska La Xilsaaray' : 'Cases Assigned', $stats['cases_assigned_count']],
            [$language === 'so' ? 'Kiisaska La Xiray' : 'Cases Closed', $stats['cases_closed_count']],
            [$language === 'so' ? 'Xabsiga Hadda' : 'Current Custody', $stats['current_custody_count']],
            [$language === 'so' ? 'Shahaadooyinka La Bixiyay' : 'Certificates Issued', $stats['certificates_issued_count']],
            [$language === 'so' ? 'Foomamka Caafimaadka' : 'Medical Forms Issued', $stats['medical_forms_issued_count']],
        ];
        
        $row++;
        foreach ($metrics as $metric) {
            $sheet->setCellValue('A' . $row, $metric[0]);
            $sheet->setCellValue('B' . $row, $metric[1]);
            $this->styleDataRow($sheet, 'A' . $row . ':B' . $row);
            $row++;
        }
        
        // Auto-size columns
        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setAutoSize(true);
    }

    /**
     * Create Cases Submitted Sheet
     */
    private function createCasesSubmittedSheet($spreadsheet, $cases, $language)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle($language === 'so' ? 'Kiisaska' : 'Cases Submitted');
        
        // Headers
        $headers = [
            $language === 'so' ? 'Lambarka Kiiska' : 'Case Number',
            $language === 'so' ? 'Lambarka OB' : 'OB Number',
            $language === 'so' ? 'Nooca Dambiga' : 'Crime Type',
            $language === 'so' ? 'Mudnaanta' : 'Priority',
            $language === 'so' ? 'Xarunta' : 'Center',
            $language === 'so' ? 'Abuuray' : 'Created By',
            $language === 'so' ? 'Waqtiga' : 'Created At'
        ];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }
        $this->styleHeaderRow($sheet, 'A1:G1');
        
        // Data
        $row = 2;
        foreach ($cases as $case) {
            $sheet->setCellValue('A' . $row, $case['case_number']);
            $sheet->setCellValue('B' . $row, $case['ob_number']);
            $sheet->setCellValue('C' . $row, $case['crime_type']);
            $sheet->setCellValue('D' . $row, strtoupper($case['priority']));
            $sheet->setCellValue('E' . $row, $case['center_name']);
            $sheet->setCellValue('F' . $row, $case['created_by_name'] ?? 'N/A');
            $sheet->setCellValue('G' . $row, date('Y-m-d H:i', strtotime($case['created_at'])));
            $this->styleDataRow($sheet, 'A' . $row . ':G' . $row);
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Create Cases Assigned Sheet
     */
    private function createCasesAssignedSheet($spreadsheet, $assignments, $language)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle($language === 'so' ? 'La Xilsaaray' : 'Cases Assigned');
        
        // Headers
        $headers = [
            $language === 'so' ? 'Lambarka Kiiska' : 'Case Number',
            $language === 'so' ? 'Nooca Dambiga' : 'Crime Type',
            $language === 'so' ? 'Baarayaasha' : 'Investigator',
            $language === 'so' ? 'Xilsaaray' : 'Assigned By',
            $language === 'so' ? 'Waqtiga Xilsaarka' : 'Assigned At',
            $language === 'so' ? 'Wakhtiga Dhammaadka' : 'Deadline'
        ];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }
        $this->styleHeaderRow($sheet, 'A1:F1');
        
        // Data
        $row = 2;
        foreach ($assignments as $assignment) {
            $sheet->setCellValue('A' . $row, $assignment['case_number']);
            $sheet->setCellValue('B' . $row, $assignment['crime_type']);
            $sheet->setCellValue('C' . $row, $assignment['investigator_name']);
            $sheet->setCellValue('D' . $row, $assignment['assigned_by_name'] ?? 'N/A');
            $sheet->setCellValue('E' . $row, date('Y-m-d H:i', strtotime($assignment['assigned_at'])));
            $sheet->setCellValue('F' . $row, $assignment['deadline'] ? date('Y-m-d', strtotime($assignment['deadline'])) : 'N/A');
            $this->styleDataRow($sheet, 'A' . $row . ':F' . $row);
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Create Cases Closed Sheet
     */
    private function createCasesClosedSheet($spreadsheet, $cases, $language)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle($language === 'so' ? 'La Xiray' : 'Cases Closed');
        
        // Headers
        $headers = [
            $language === 'so' ? 'Lambarka Kiiska' : 'Case Number',
            $language === 'so' ? 'Nooca Dambiga' : 'Crime Type',
            $language === 'so' ? 'Xiray' : 'Closed By',
            $language === 'so' ? 'Waqtiga Xitaanka' : 'Closed At',
            $language === 'so' ? 'Sababta' : 'Closure Reason'
        ];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }
        $this->styleHeaderRow($sheet, 'A1:E1');
        
        // Data
        $row = 2;
        foreach ($cases as $case) {
            $sheet->setCellValue('A' . $row, $case['case_number']);
            $sheet->setCellValue('B' . $row, $case['crime_type']);
            $sheet->setCellValue('C' . $row, $case['closed_by_name'] ?? 'N/A');
            $sheet->setCellValue('D' . $row, date('Y-m-d H:i', strtotime($case['closed_at'])));
            $sheet->setCellValue('E' . $row, $case['closure_reason'] ?? 'N/A');
            $this->styleDataRow($sheet, 'A' . $row . ':E' . $row);
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Create Custody Sheet
     */
    private function createCustodySheet($spreadsheet, $custody, $language)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle($language === 'so' ? 'Xabsiga' : 'Current Custody');
        
        // Headers
        $headers = [
            $language === 'so' ? 'Magaca' : 'Person Name',
            $language === 'so' ? 'Lambarka Aqoonsiga' : 'National ID',
            $language === 'so' ? 'Lambarka Kiiska' : 'Case Number',
            $language === 'so' ? 'Goobta' : 'Location',
            $language === 'so' ? 'Bilawga Xabsiga' : 'Custody Start'
        ];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }
        $this->styleHeaderRow($sheet, 'A1:E1');
        
        // Data
        $row = 2;
        foreach ($custody as $record) {
            $sheet->setCellValue('A' . $row, $record['person_full_name']);
            $sheet->setCellValue('B' . $row, $record['national_id'] ?? 'N/A');
            $sheet->setCellValue('C' . $row, $record['case_number']);
            $sheet->setCellValue('D' . $row, $record['custody_location'] ?? 'N/A');
            $sheet->setCellValue('E' . $row, date('Y-m-d H:i', strtotime($record['custody_start'])));
            $this->styleDataRow($sheet, 'A' . $row . ':E' . $row);
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Create Certificates Sheet
     */
    private function createCertificatesSheet($spreadsheet, $certificates, $language)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle($language === 'so' ? 'Shahaadooyinka' : 'Certificates');
        
        // Headers
        $headers = [
            $language === 'so' ? 'Lambarka Shahaadada' : 'Certificate Number',
            $language === 'so' ? 'Magaca' : 'Person Name',
            $language === 'so' ? 'Ujeedda' : 'Purpose',
            $language === 'so' ? 'Taariikhda Bixinta' : 'Issue Date',
            $language === 'so' ? 'Bixiyay' : 'Issued By'
        ];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }
        $this->styleHeaderRow($sheet, 'A1:E1');
        
        // Data
        $row = 2;
        foreach ($certificates as $cert) {
            $sheet->setCellValue('A' . $row, $cert['certificate_number']);
            $sheet->setCellValue('B' . $row, $cert['person_full_name'] ?? $cert['person_name']);
            $sheet->setCellValue('C' . $row, $cert['purpose'] ?? 'N/A');
            $sheet->setCellValue('D' . $row, date('Y-m-d', strtotime($cert['issue_date'])));
            $sheet->setCellValue('E' . $row, $cert['issued_by_name'] ?? 'N/A');
            $this->styleDataRow($sheet, 'A' . $row . ':E' . $row);
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Create Medical Forms Sheet
     */
    private function createMedicalFormsSheet($spreadsheet, $forms, $language)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle($language === 'so' ? 'Foomamka' : 'Medical Forms');
        
        // Headers
        $headers = [
            $language === 'so' ? 'Lambarka Kiiska' : 'Case Number',
            $language === 'so' ? 'Magaca Bukaanka' : 'Patient Name',
            $language === 'so' ? 'Magaca Isbitaalka' : 'Hospital Name',
            $language === 'so' ? 'Taariikhda Baaritaanka' : 'Examination Date',
            $language === 'so' ? 'Abuuray' : 'Created By'
        ];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }
        $this->styleHeaderRow($sheet, 'A1:E1');
        
        // Data
        $row = 2;
        foreach ($forms as $form) {
            $sheet->setCellValue('A' . $row, $form['case_number']);
            $sheet->setCellValue('B' . $row, $form['person_full_name'] ?? $form['patient_name']);
            $sheet->setCellValue('C' . $row, $form['hospital_name'] ?? 'N/A');
            $sheet->setCellValue('D' . $row, date('Y-m-d', strtotime($form['examination_date'])));
            $sheet->setCellValue('E' . $row, $form['created_by_name'] ?? 'N/A');
            $this->styleDataRow($sheet, 'A' . $row . ':E' . $row);
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Style header
     */
    private function styleHeader($sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 16,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2563eb']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);
        $sheet->getRowDimension('1')->setRowHeight(30);
    }

    /**
     * Style header row
     */
    private function styleHeaderRow($sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '3b82f6']
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'cbd5e1']
                ]
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);
    }

    /**
     * Style data row
     */
    private function styleDataRow($sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'e2e8f0']
                ]
            ]
        ]);
    }

    /**
     * Get period label
     */
    private function getPeriodLabel($period, $language)
    {
        $labels = [
            'en' => [
                'today' => 'Today',
                'week' => 'This Week',
                'month' => 'This Month',
                'year' => 'This Year'
            ],
            'so' => [
                'today' => 'Maanta',
                'week' => 'Toddobaadkan',
                'month' => 'Bisha',
                'year' => 'Sannadkan'
            ]
        ];
        
        return $labels[$language][$period] ?? $labels['en'][$period];
    }
}
