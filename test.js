import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import XLSX from 'xlsx'

/**
 * 语言映射表：Excel 表头 -> 标准语言码
 */
const languageMap = {
  'English': 'en-US',
  'Chinese': 'zh-CN',
}

// 读取 Excel 文件
function readExcel(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ Excel 文件未找到: ${filePath}`)
  }
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet)
}

/**
 * 清空输出目录
 */
function clearOutputDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => fs.unlinkSync(path.join(dirPath, file)))
    console.log(`🧹 已清空目录: ${dirPath}`)
  } else {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`📂 创建目录: ${dirPath}`)
  }
}

/**
 * 生成 JSON 文件
 */
function generateLocales(rows, outputDir) {
  const locales = {}

  rows.forEach(row => {
    const key = row.Key
    console.log('key', key)
    if (!key) return

    // 遍历语言列
    Object.entries(languageMap).forEach(([columnName, langCode]) => {
      if (!locales[langCode]) locales[langCode] = {}

      const value = row[columnName] || ''
      console.log('value', value)
      const keys = key.split('.')
      console.log('keys', keys)
      let current = locales[langCode]
      console.log('current', current)

      keys.forEach((k, idx) => {
        if (idx === keys.length - 1) {
          current[k] = value
        } else {
          current[k] = current[k] || {}
          current = current[k]
        }
      })
    })
  })

  console.log(JSON.stringify(locales))

  return

  // 输出文件
  Object.entries(locales).forEach(([lang, data]) => {
    const filePath = path.join(outputDir, `${lang}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`✅ 生成文件: ${filePath}`)
  })
}

/**
 * 检测缺失翻译
 */
function detectMissingTranslations(rows) {
  const missing = []
  rows.forEach(row => {
    const key = row.Key
    if (!key) return

    Object.entries(languageMap).forEach(([columnName, langCode]) => {
      const value = row[columnName]
      if (!value?.trim()) {
        missing.push({ key, lang: langCode })
      }
    })
  })
  return missing
}

function logMissingTranslations(missingList) {
  if (missingList.length === 0) {
    console.log('\n🎉 所有 key 的翻译完整！')
    return
  }

  console.warn('\n⚠️ 以下 key 缺少翻译:')
  missingList.forEach(item => {
    console.warn(`  - key: "${item.key}" 缺少语言: ${item.lang}`)
  })
}

function main() {
  const desktopPath = path.join('./hotel多语言.xlsx')
  const outputDir = path.resolve('./i18n/locales')

  const rows = readExcel(desktopPath)
  clearOutputDir(outputDir)
  generateLocales(rows, outputDir)
  // logMissingTranslations(detectMissingTranslations(rows))
}

main()