export default {
  editor: {
    label: {
      en: 'Reseller Portal',
      no: 'Forhandlerportal'
    },
    icon: 'briefcase',
    bubble: {
      icon: 'briefcase'
    }
  },
  properties: {
    supabaseUrl: {
      label: {
        en: 'Supabase Project URL',
        no: 'Supabase Prosjekt URL'
      },
      type: 'Text',
      section: 'settings',
      defaultValue: 'https://prjefvmijalarmbxytjj.supabase.co',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Your Supabase project URL (e.g., https://xxx.supabase.co)'
      }
      /* wwEditor:end */
    },
    supabaseAnonKey: {
      label: {
        en: 'Supabase Anon Key',
        no: 'Supabase Anon Nokkel'
      },
      type: 'Text',
      section: 'settings',
      defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByamVmdm1pamFsYXJtYnh5dGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzODY1MjQsImV4cCI6MjA3Njk2MjUyNH0.4Czz_OjQIvmMDrz_lckxUcX3MUEu8O_WiDnP0q_6VWQ',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Your Supabase anon/public key (safe to expose in frontend)'
      }
      /* wwEditor:end */
    },
    loginRedirectUrl: {
      label: {
        en: 'Login Redirect URL',
        no: 'Login Redirect URL'
      },
      type: 'Text',
      section: 'settings',
      defaultValue: '/login?redirect=/forhandler',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Where to redirect users who are not logged in'
      }
      /* wwEditor:end */
    },
    pageSize: {
      label: {
        en: 'Items per page',
        no: 'Elementer per side'
      },
      type: 'Number',
      section: 'settings',
      defaultValue: 25,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'number',
        tooltip: 'Number of items to show per page in tables'
      }
      /* wwEditor:end */
    }
  }
};
