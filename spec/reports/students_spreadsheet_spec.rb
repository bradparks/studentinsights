require 'rails_helper'

RSpec.describe StudentsSpreadsheet do
  context 'with generated students' do
    before { srand(42) } # seed random number generator for deterministic test data
    before { School.seed_somerville_schools }
    let!(:school) { School.find_by_name('Arthur D Healey') }
    let!(:educator) { FactoryGirl.create(:educator, :admin, school: school) }
    let!(:homeroom) { Homeroom.create(name: 'HEA 300', grade: '3', school: school) }
    before do
      5.times { FakeStudent.new(school, homeroom) }
      Student.update_risk_levels
      Student.update_student_school_years
      Student.update_recent_student_assessments
    end

    describe '#csv_string' do
      it 'generates expected CSV' do
        csv_string = StudentsSpreadsheet.new.csv_string(school.students)
        expected_csv_filename = File.expand_path("#{Rails.root}/spec/reports/students_spreadsheet_expected.csv")
        expect(csv_string).to eq(IO.read(expected_csv_filename))
      end

      it 'creates expected fields' do
        flat_row_hash = StudentsSpreadsheet.new.send(:flat_row_hash, school.students.first, ServiceType.all)
        expect(flat_row_hash.keys).to eq([
         'id',
         'grade',
         'hispanic_latino',
         'race',
         'free_reduced_lunch',
         'homeroom_id',
         'first_name',
         'last_name',
         'state_id',
         'home_language',
         'school_id',
         'student_address',
         'registration_date',
         'local_id',
         'program_assigned',
         'sped_placement',
         'disability',
         'sped_level_of_need',
         'plan_504',
         'limited_english_proficiency',
         'most_recent_mcas_math_growth',
         'most_recent_mcas_ela_growth',
         'most_recent_mcas_math_performance',
         'most_recent_mcas_ela_performance',
         'most_recent_mcas_math_scaled',
         'most_recent_mcas_ela_scaled',
         'most_recent_star_reading_percentile',
         'most_recent_star_math_percentile',
         'enrollment_status',
         'date_of_birth',
         'student_risk_level',
         'discipline_incidents_count',
         'absences_count',
         'tardies_count',
         'homeroom_name',
         'Attendance Officer (active_service_date_started)',
         'Attendance Contract (active_service_date_started)',
         'Behavior Contract (active_service_date_started)',
         'Counseling, in-house (active_service_date_started)',
         'Counseling, outside (active_service_date_started)',
         'Reading intervention (active_service_date_started)',
         'Math intervention (active_service_date_started)',
         'SST Meeting (last_event_note_recorded_at)',
         'MTSS Meeting (last_event_note_recorded_at)',
         'Parent conversation (last_event_note_recorded_at)',
         'Something else (last_event_note_recorded_at)'
        ])
      end
    end
  end
end